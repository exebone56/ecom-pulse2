import Modal from '../UI/Modal'
import Button from '../UI/Buttons/Button'
import Input from '../UI/Buttons/Input'

const EditEmployeeForm = ({isOpen, onClose}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} headerForm={"Редактировать информацию о сотруднике"}>
      <form className='flex flex-col gap-y-3'>
        <label className='flex flex-col text-xl gap-y-1'>
          <span>Имя</span>
          <div className='flex gap-4'>
              <Input type="text" value={"Name"} placeholder={"ВВедите имя сотрудника"}/>
          </div>
        </label>
        <label className='flex flex-col text-xl gap-y-1'>
          <span>Фамилия</span>
          <div className='flex gap-4'>
              <Input type="text" value={"LastName"} placeholder={"ВВедите фамилию сотрудника"}/>
          </div>
        </label>
        <label className='flex flex-col text-xl gap-y-1'>
          <span>Электронная почта</span>
          <div className='flex gap-4'>
              <Input type="text" value={"Email"} placeholder={"Электронная почта"}/>
          </div>
        </label>
        <label className='flex flex-col text-xl gap-y-1'>
          <span>Номер телефона</span>
          <div className='flex gap-4'>
              <Input type="text" value={"Email"} placeholder={"Электронная почта"}/>
          </div>
        </label>
        <label className='flex flex-col text-xl gap-y-1'>
          <span>Должность</span>
          <div className='flex gap-4'>
              <Input type="text" value={"Position"} placeholder={"Выберите должность сотрудника"}/>
          </div>
        </label>
        <Button bgColor="#D23D3D">Сохранить данные</Button>
      </form>
    </Modal>
  )
}

export default EditEmployeeForm