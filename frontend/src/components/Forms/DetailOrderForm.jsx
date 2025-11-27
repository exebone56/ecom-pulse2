import Modal from '../UI/Modal'

const DetailOrderForm = ({ isOpen, onClose, order }) => {
  if (!order) return null;
  
  const item = order.items?.[0];
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} headerForm="Информация о заказе:">
      <div className="flex justify-between items-start gap-x-6">
        <div className="flex flex-col wrap-break-word w-[55%]">
          <div className="flex text-[18px] pb-3">
            <div className="text-white flex flex-col w-full">
              <div className="flex gap-2">
                <span className='flex items-center justify-center py-2 rounded-lg bg-[#264C64] w-48'>
                  {order.marketplace}
                </span>
                <span className='flex items-center justify-center py-2 rounded-lg bg-[#407E41] w-48'>
                  FBS
                </span>
              </div>
              <div className="text-white/25 flex flex-col text-[14px] pt-1">
                <span>ID Заказа в системе: {order.id}</span>
                <span>ID Заказа на маркетплейсе: {order.orderNumber}</span>
              </div>
            </div>
          </div>
          <ul className='flex flex-col flex-wrap gap-y-1'>
            <li className='border-t-2 border-white/10 py-2 w-full'>
              <span className='font-light'>Номер заказа: <span className='text-[14px] font-bold'>{order.orderNumber}</span></span>
            </li>
            <li className='border-t-2 border-white/10 py-2 w-full'>
              <span className='font-light'>Главный артикул товара: <span className='text-[14px] font-bold'>{item?.name || '—'}</span></span>
            </li>
            <li className='border-t-2 border-white/10 py-2 w-full'>
              <span className='font-light'>Артикул товара на маркетплейсе: <span className='text-[14px] font-bold'>{item?.article || '—'}</span></span>
            </li>
            <li className='border-t-2 border-white/10 py-2 w-full'>
              <span className='font-light'>Цена продажи: <span className='text-[14px] font-bold'>{item?.price} руб.</span></span>
            </li>
            <li className='border-t-2 border-white/10 py-2 w-full'>
              <span className='font-light'>Склад продажи: <span className='text-[14px] font-bold'>Оренбург, Строителей</span></span>
            </li>
          </ul>
        </div>
        <div className="max-w-[400px] aspect-square rounded-lg md:max-w-1/2">
          <img 
            src={'../../src/assets/icons/product.png'} 
            className='border-2 border-white/25 h-full w-full rounded-lg object-cover' 
          />
        </div>
      </div> 
    </Modal>
  )
}

export default DetailOrderForm