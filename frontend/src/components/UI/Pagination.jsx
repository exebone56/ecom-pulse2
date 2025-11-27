import Button from "./Buttons/Button"

const Pagination = ({currentPage, totalPages, itemsPerPage, onPageChange, onItemsPerPageChange}) => {
  return (
    <div className='flex justify-between items-center mt-4 px-4'>
        <div>
            Страница {currentPage} из {totalPages}
        </div>
        <div className="flex gap-2">
            <button className="cursor-pointer bg-accent border-2 border-transparent py-1 px-4 rounded-md hover:border-white w-25"
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
            >
                Назад
            </button>
            
            {[...Array(totalPages)].map((_, index) => (
                <button
                    key={index + 1}
                    onClick={() => onPageChange(index + 1)}
                    className={`cursor-pointer text-gray-400 hover:scale-110 hover:text-gray-50 ${currentPage === index + 1 ? 'active':''}`}
                >
                    {index + 1}
                </button>
            ))}

            <button
                className="cursor-pointer bg-accent border-2 border-transparent py-1 px-4 rounded-md hover:border-white w-25"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
            >
                Вперед
            </button>
        </div>
        <select
            className="cursor-pointer bg-transparent rounded-sm hover:bg-accent [&>option]:bg-accent [&>option]:text-white [&>option]:rounded-sm"
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
        >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
        </select>
    </div>
  )
}

export default Pagination