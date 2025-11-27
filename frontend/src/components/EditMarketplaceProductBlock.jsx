import React from 'react'
import CollapsibleBlock from './CollapsibleBlock'
import Button from './UI/Buttons/Button'
import Input from './UI/Buttons/Input'

const EditMarketplaceProductBlock = ({title, bgColor}) => {
  return (
    <CollapsibleBlock title={title} bgColor={bgColor}>
        <form className="flex flex-col items-center gap-y-10">
            <div className="w-full">
                <div className='flex flex-col'>
                    <span>Статус товара: <span className='font-black'>Не создан</span></span>
                    <span>Внешний артикул из маркетплейса: <span className='font-black'>125125125</span></span>
                </div>
                <label className='flex flex-col'>
                    <span>Штрихкод</span>
                    <div className='flex gap-4'>
                        <Input type="text" value={"12412"} placeholder={"BARCODE"}/>
                        <Button size="l" bgColor="#1f2937">Сгенерировать</Button>
                    </div>
                </label>
                <label className='flex flex-col'>
                    <span>Цена продажи, руб.</span>
                    <div className='flex gap-4'>
                        <Input type="text" value={"12412"} placeholder={"цена"}/>
                        <Button size="l" bgColor="#1f2937">Обновить</Button>
                    </div>
                </label>
                <label className='flex flex-col'>
                    <span>Зачеркнутая цена, руб.</span>
                    <div className='flex gap-4'>
                        <Input type="text" value={"12412"} placeholder={"цена"}/>
                        <Button size="l" bgColor="#1f2937">Обновить</Button>
                    </div>
                </label>
            </div>
            <div className="flex flex-col items-center w-1/2">
                <span className='uppercase font-bold text-[18px] mb-5'>Специфичные характеристики</span>
                <div className="w-full">
                    <ul>
                        <li>
                            <label className='flex flex-col'>
                                <span>Зачеркнутая цена, руб.</span>
                                <div className='flex gap-4'>
                                    <Input type="text" value={"12412"} placeholder={"цена"}/>
                                </div>
                            </label>
                        </li>
                    </ul>
                </div>
            </div>
            <Button size="l" bgColor="#1f2937">Обновить данные на маркетплейсе {title}</Button>
        </form>
    </CollapsibleBlock>
  )
}

export default EditMarketplaceProductBlock