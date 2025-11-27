import { useRef, useEffect, useState, useCallback } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';

const DebouncedChart = ({ 
    data = [],
    xAxisData = [],
    xAxisLabel = "Месяц",
    seriesLabel = "",
    height = 400,
    color = "#FCB859",
    tooltipFormatter,
    valueFormatter,
    margin = { left: 60, right: 30, top: 30, bottom: 50 }
}) => {
    const chartRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState('100%');
    const [isResizing, setIsResizing] = useState(false);

    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    const handleResize = useCallback(debounce((entries) => {
        const width = entries[0].contentRect.width;
        setContainerWidth(width);
        setIsResizing(false);
    }, 150), []);

    useEffect(() => {
        const container = chartRef.current?.closest('.chart-container') || chartRef.current?.parentElement;
        if (!container) return;

        setIsResizing(true);

        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
        };
    }, [handleResize]);

    // Форматтер по умолчанию для тултипа
    const defaultTooltipFormatter = (params) => [
        `Период: ${(params.dataIndex || 0) + 1}`,
        `Значение: ${(params.value || 0).toLocaleString('ru-RU')}`
    ];

    // Форматтер по умолчанию для значений Y
    const defaultValueFormatter = (value) => {
        if (value >= 1000000) return `${(value/1000000).toFixed(0)}M`;
        if (value >= 1000) return `${(value/1000).toFixed(0)}K`;
        return value > 100 ? `${value}` : value.toString();
    };

    // Генерируем данные для оси X, если не переданы
    const generatedXAxisData = xAxisData.length > 0 
        ? xAxisData 
        : Array.from({ length: data.length }, (_, i) => i + 1);

    return (
        <div 
            ref={chartRef}
            style={{ 
                width: '100%', 
                height: `${height}px`,
                opacity: isResizing ? 0.7 : 1,
                transition: 'opacity 0.2s ease'
            }}
        >
            <LineChart
                xAxis={[
                    {
                        data: generatedXAxisData,
                        scaleType: 'point',
                        label: xAxisLabel,
                        labelStyle: {
                            fontSize: 10,
                            fill: 'white',
                            textTransform: "uppercase"
                        },
                        tickLabelStyle: {
                            fontSize: 12,
                            fill: 'white',
                        },
                    }
                ]} 
                series={[{
                    data: data,
                    area: true,
                    showMark: false,
                    color: color,
                }]}
                tooltip={{
                    trigger: 'item',
                }}
                slotProps={{
                    tooltip: {
                        style: {
                            animation: 'none',
                            transition: 'none',
                            transform: 'none',
                            color: "black",
                        },
                        formatter: tooltipFormatter || defaultTooltipFormatter,
                    }
                }}
                sx={{
                    "& .MuiChartsSurface-root": {
                        width: "100% !important",
                        height: "100% !important",
                    },
                    "& .MuiAreaElement-root":{
                        fill: `url(#areaGradient-${color.replace('#', '')})`,
                    },
                    "& .MuiLineElement-root": {
                        transition: "stroke-dashoffset 0.3s ease",
                    },
                    "& .MuiChartsAxis-line":{
                        display: "none",
                    },
                    "& .MuiChartsAxis-tick":{
                        display: "none",
                    },
                    // Отключаем анимации при ресайзе
                    "& .MuiChartsAxis-tickLabel": {
                        transition: isResizing ? 'none' : 'opacity 0.3s ease',
                    },
                }}
                yAxis={[{
                    valueFormatter: valueFormatter || defaultValueFormatter,
                    tickLabelStyle: {
                        fill: 'white',
                    },
                }]}
                animation={isResizing ? undefined : {
                    duration: 500,
                }}
                margin={margin}
            >
                <defs>
                    <linearGradient 
                        id={`areaGradient-${color.replace('#', '')}`} 
                        x1="0" 
                        y1="0" 
                        x2="0" 
                        y2="100%"
                    >
                        <stop offset="-10%" stopColor={color} stopOpacity={0.6}/>
                        <stop offset="100%" stopColor={color} stopOpacity={0}/>
                    </linearGradient>
                </defs>
            </LineChart>
        </div>
    );
};

export default DebouncedChart;