import MarketplaceStatus from "../components/UI/MarketplaceStatus";
export const productTableColumn = [
    {
        key: "main_img",
        title: "Фото",
        cellClassName: "w-20 min-w-20",
        render: (value, row) => (
            value ?
                <div className="w-20 h-20 flex justify-center items-center">
                    <img 
                        src={value} 
                        alt={row.article}
                        className="w-12 h-17 object-cover rounded"
                    />
                </div>
                 :
                <div className="w-15 h-15 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-gray-500 text-xs">Нет фото</span>
                </div>
        )
    },
    {
        key: "article",
        title: "Артикул",
        cellClassName: "min-w-32 font-medium"
    },
    {
        key: "category", 
        title: "Категория",
        cellClassName: "min-w-40"
    },
    {
        key: "direction",
        title: "Направление", 
        cellClassName: "min-w-40"
    },
    {
        key: "wildberries",
        title: "Wildberries",
        cellClassName: "min-w-32 text-center",
        render: (_, row) => (
            <MarketplaceStatus 
                marketplace={row.marketplaces?.find(m => m.marketplace_name === 'Wildberries')}
            />
        )
    },
    {
        key: "ozon",
        title: "Ozon",
        cellClassName: "min-w-32 text-center",
        render: (_, row) => (
            <MarketplaceStatus 
                marketplace={row.marketplaces?.find(m => m.marketplace_name === 'Ozon')}
            />
        )
    },
    {
        key: "yandex_market",
        title: "Яндекс.Маркет",
        cellClassName: "min-w-32 text-center",
        render: (_, row) => (
            <MarketplaceStatus 
                marketplace={row.marketplaces?.find(m => m.marketplace_name === 'Yandex Market')}
            />
        )
    },
    {
        key: "is_active",
        title: "Статус",
        cellClassName: "min-w-24",
        render: (value) => (
            <span className={`px-2 py-1 rounded text-xs ${
                value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
                {value ? 'Активный' : 'Неактивный'}
            </span>
        )
    },
    {
        key: "created_at",
        title: "Дата создания",
        cellClassName: "min-w-32"
    }
];

export const employeeTableColumn = [
    {
        key: "avatar_url",
        title: "Фото",
        cellClassName: "w-15 h-15 min-w-15 min-h-15 px-2",
        render: (value) => value 
        ? <img src={value} className="w-12 h-12 object-cover rounded" /> 
        : <div className="w-12 h-12 bg-gray-300 rounded flex items-center justify-center">📷</div>
    },
    {
        key: "full_name",
        title: "ФИО сотрудника"
    },
    {
        key: "email",
        title: "Электронная почта",
    },
    {
        key: "phone_number",
        title: "Номер телефона",
    },
    {
        key: "birthday",
        title: "Дата рождения",
    },
    {
        key: "role",
        title: "Роль",
    },
    {
        key: "employment_date",
        title: "Дата трудоустройства",
    },
]

export const ordersTableColumn = [
    {
        key: "img",
        title: "Фото",
        cellClassName: "w-12 h-12 min-w-12 min-h-12 px-2",
        render: (value) => value 
        ? <img src={value} className="w-12 h-12 object-cover rounded" /> 
        : <div className="w-12 h-12 bg-gray-300 rounded flex items-center justify-center">📷</div>
    },
    {
        key: "id",
        title: "ID Заказа",
    },
    {
        key: "orderNumber",
        title: "Номер заказа",
    },
    {
        key: "departureNumber",
        title: "Номер отправления",
    },
    {
        key: "article",
        title: "Артикул",
    },
    {
        key: "salePrice",
        title: "Цена продажи",
    },
    {
        key: "quantity",
        title: "Количество",
    },
    {
        key: "orderCost",
        title: "Стоимость заказа",
    },
    {
        key: "marketplace",
        title: "Маркетплейс",
    },
    {
        key: "orderType",
        title: "Тип заказа"
    },
    {
        key: "orderStatus",
        title: "Статус заказа"
    },
    {
        key: "orderDate",
        title: "Дата заказа"
    },
    {
        key: "warehouse",
        title: "Склад продажи"
    }
]

export const topCategoriesTableColumn = [
    {
        key: "categoriesName",
        title: "Название"
    },
    {
        key: "sales",
        title: "Продажи"
    }
]

export const stockProductTableColumn = [
  {
    key: "img",
    title: "Фото",
    cellClassName: "w-15 h-15 min-w-15 min-h-15 px-2",
    render: (value) => value 
      ? <img src={value} className="w-12 h-12 object-cover rounded" alt="Товар" /> 
      : <div className="w-12 h-12 bg-gray-300 rounded flex items-center justify-center">📷</div>
  },
  {
    key: "article",
    title: "Артикул"
  },
  {
    key: "availableCount",
    title: "Доступно",
    editable: true,
    cellClassName: "py-4 px-1 truncate max-w-32 cursor-pointer hover:bg-gray-700",
    validate: (value) => !isNaN(value) && value >= 0
  },
  {
    key: "reservedAll",
    title: "В резерве всего"
  },
  {
    key: "reservedByOzon",
    title: "В резерве Ozon"
  },
  {
    key: "reservedByWb",
    title: "В резерве Wildberries"
  },
  {
    key: "reservedByYandex",
    title: "В резерве Яндекс.Маркет"
  },
]

export const incomingDocumentTableColumn = [
    {
        key: "numberIncomingDocument",
        title: "Номер документа",
    },
    {
        key: "partner",
        title: "Партнер",
    },
    {
        key: "destinationWarehouse",
        title: "Склад назначения",
    },
    {
        key: "totalProducts",
        title: "Кол-во товара",
    },
    {
        key: "totalCost",
        title: "Общая стоимость",
    },
    {
        key: "createdAt",
        title: "Дата создания",
    },
    {
        key: "status",
        title: "Статус",
    },
]

export const lowStockTableColumns = [
  {
    key: "article",
    title: "Артикул",
    sortable: true
  },
  {
    key: "available_quantity",
    title: "Остаток",
    sortable: true,
    cellStyle: (value) => ({
      color: value <= 2 ? '#EF4444' : value <= 5 ? '#F59E0B' : 'inherit',
      fontWeight: value <= 5 ? 'bold' : 'normal'
    })
  },
  {
    key: "total_reserved",
    title: "В резерве",
    sortable: true
  }
];