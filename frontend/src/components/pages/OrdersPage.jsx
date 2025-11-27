import MainLayout from '../Layout/MainLayout'
import CollapsibleBlock from '../CollapsibleBlock'
import { ordersTableColumn } from '../../data/tableSettings'
import DataTable from '../Table/DataTable'
import InfoOutlineIcon from '@mui/icons-material/InfoOutline';
import { useState, useEffect } from 'react';
import DetailOrderForm from '../Forms/DetailOrderForm';
import axios from 'axios';

const OrdersPage = () => {
  const [openOrderDetailInfo, setOpenOrderDetailInfo] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    amountFrom: "",
    amountTo: ""
  });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, total: 0 });

  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        search: searchTerm || undefined,
        date_from: filters.dateFrom || undefined,
        date_to: filters.dateTo || undefined,
        amount_from: filters.amountFrom || undefined,
        amount_to: filters.amountTo || undefined,
      };
      
      const response = await axios.get('http://127.0.0.1:8000/api/orders/', { params });
      
      const preparedOrders = response.data.results.map(order => {
        const item = order.items?.[0] || {};
        
        return {
          ...order,
          article: item.article || '',
          img: item.img || null,
          salePrice: item.price || 0,
          quantity: item.quantity || 0,
          orderDate: order.order_date ? new Date(order.order_date).toLocaleDateString() : '',
          orderType: 'FBS',
          warehouse: 'Склад 1'
        };
      });
      setOrders(preparedOrders);
      setPagination({
        currentPage: page,
        total: response.data.count,
        next: response.data.next,
        previous: response.data.previous
      });
    } catch (error) {
      console.error("Ошибка загрузки заказов:", error);
    } finally {
      setLoading(false);
    }

  };

  useEffect(() => {
    fetchOrders();
  }, [searchTerm, filters]);

  const handleOpenOrderDetail = (order) => {
    setSelectedOrder(order);
    setOpenOrderDetailInfo(true);
  };

  const orderTableColumnWithInfo = [
    ...ordersTableColumn,
    {
      key: "info",
      title: "",
      cellClassName: "w-15 h-15 min-w-15 min-h-15",
      render: (_, row) => (
        <button 
          onClick={() => handleOpenOrderDetail(row)}
          className="cursor-pointer text-gray-200 hover:text-white hover:scale-105 px-3 py-1"
        >
          <InfoOutlineIcon />
        </button>
      ) 
    }
  ];

  return (
    <>
      {openOrderDetailInfo && (
        <DetailOrderForm 
          isOpen={openOrderDetailInfo} 
          onClose={() => setOpenOrderDetailInfo(false)} 
          order={selectedOrder}
        />
      )}
      <MainLayout>
        <CollapsibleBlock title={"Фильтры для поиска"} bgColor="#1D1D1D">
          <div className="border-2 border-gray-600 rounded-xl pb-5 mb-5">
            <div className="p-4 border-b border-gray-600 space-y-4">
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder='Поиск по артикулу или номеру заказа...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-600 rounded bg-transparent text-white"
                />
                <button 
                  onClick={() => setSearchTerm("")}
                  className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700"
                >
                  Очистить
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className='block text-sm mb-1'>Дата от</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters(prev => ({...prev, dateFrom: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-600 rounded bg-transparent text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Дата до</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters(prev => ({...prev, dateTo: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-600 rounded bg-transparent text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Сумма от</label>
                  <input
                    type="number"
                    value={filters.amountFrom}
                    onChange={(e) => setFilters(prev => ({...prev, amountFrom: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-600 rounded bg-transparent text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Сумма до</label>
                  <input
                    type="number"
                    value={filters.amountTo}
                    onChange={(e) => setFilters(prev => ({...prev, amountTo: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-600 rounded bg-transparent text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </CollapsibleBlock>
        
        <div className="border-2 border-gray-600 rounded-xl pb-5 overflow-hidden">
  <div className="max-h-[695px] overflow-auto rounded-xl">
    <table className='w-full border-collapse'>
      <thead className="sticky top-0 bg-gray-800 z-10">
        <tr>
          {orderTableColumnWithInfo.map((col) => (
            <th className='p-4' key={col.key} scope='col'>
              {col.title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {orders.map((row, rowIndex) => (
          <tr key={row.id || `row-${rowIndex}`} className='text-center border-b border-gray-600'>
            {orderTableColumnWithInfo.map(col => (
              <td 
                className={`${col.cellClassName || 'py-4 truncate max-w-32'}`}
                key={col.key}
              >
                {col.render ? 
                  col.render(row[col.key], row) : 
                  row[col.key]
                }
              </td>
            ))}
          </tr>
        ))}
        </tbody>
      </table>
    </div>
  </div>

  {/* Пагинация */}
  <div className="flex justify-between items-center mt-4">
    <button
      onClick={() => fetchOrders(pagination.currentPage - 1)}
      disabled={!pagination.previous}
      className="px-4 py-2 bg-gray-600 rounded disabled:opacity-50"
    >
      Назад
    </button>
    
    <span className="text-white">
      Страница {pagination.currentPage} из {Math.ceil(pagination.total / 25)}
    </span>
    
    <button
      onClick={() => fetchOrders(pagination.currentPage + 1)}
      disabled={!pagination.next}
      className="px-4 py-2 bg-gray-600 rounded disabled:opacity-50"
    >
      Вперед
    </button>
  </div>
      </MainLayout>
    </>
  )
}

export default OrdersPage