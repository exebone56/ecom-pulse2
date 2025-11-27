import React, { useState, useEffect } from 'react'
import AnalyticBlock from '../AnalyticBlock'
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { Gauge } from '@mui/x-charts/Gauge';
import { analyticsApi } from '../../services/analyticsApi';
import CircularProgress from '@mui/material/CircularProgress';

const RevenueMonth = () => {
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRevenueData();
  }, []);

  const loadRevenueData = async () => {
    try {
      setLoading(true);
      const data = await analyticsApi.getRevenueStats();
      setRevenueData(data);
    } catch (err) {
      setError('Ошибка загрузки данных');
      console.error('Error loading revenue data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('₽', '₽');
  };

  if (loading) {
    return (
      <AnalyticBlock 
        title="Выручка за месяц" 
        subtitle="По всем маркетплейсам"
        extraClasses={"w-full"}
      >
        <div className="flex items-center justify-center h-32">
          <CircularProgress />
        </div>
      </AnalyticBlock>
    );
  }

  if (error) {
    return (
      <AnalyticBlock 
        title="Выручка за месяц" 
        subtitle="По всем маркетплейсам"
        extraClasses={"w-full"}
      >
        <div className="flex items-center justify-center h-32 text-red-500">
          {error}
        </div>
      </AnalyticBlock>
    );
  }

  const {
    current_month_revenue = 0,
    percentage_change = 0,
    is_positive = true
  } = revenueData || {};

  const gaugeValue = Math.min(Math.max(percentage_change + 50, 0), 100); // Нормализуем для графика

  return (
    <AnalyticBlock 
      title="Выручка за месяц" 
      subtitle="По всем маркетплейсам"
      extraClasses={"w-full"}
    >
      <div className="flex flex-col justify-between">
        <div className="flex flex-col text-[12px]">
          <span className='text-[#FEB95A] text-4xl font-black'>
            {formatCurrency(current_month_revenue)}
          </span>
          <span className='flex items-center gap-x-1 text-white/25'>
            На {Math.abs(percentage_change)}% {is_positive ? 'больше' : 'меньше'} чем в прошлом месяце 
            <span className={is_positive ? 'text-[#407E41]' : 'text-[#E53E3E]'}>
              {is_positive ? <TrendingUpIcon/> : <TrendingDownIcon/>}
            </span>
          </span>
        </div>
        <div className="flex items-center justify-center">
          <Gauge 
            width={200} 
            height={150} 
            value={gaugeValue} 
            startAngle={-90} 
            endAngle={90} 
            sx={{
              '& .MuiGauge-referenceArc': {
                fill: "#2B2B36"
              },
              '& .MuiGauge-valueArc': {
                fill: is_positive ? "#407E41" : "#E53E3E"
              },
              '& .MuiGauge-valueText': {
                fontSize: "32px",
                fontWeight: "900",
                transform: "translateY(-20px)",
                fill: is_positive ? "#407E41 !important" : "#E53E3E !important",
              },
              '& text': {
                fill: is_positive ? "#407E41 !important" : "#E53E3E !important"
              }
            }}
          />
        </div>
      </div>
    </AnalyticBlock>
  )
}

export default RevenueMonth;