import React, { useState, useEffect } from 'react';
import AnalyticBlock from '../AnalyticBlock';
import CurrentIndicatorCard from './CurrentIndicatorCard';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import RemoveShoppingCartIcon from '@mui/icons-material/RemoveShoppingCart';
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import { analyticsApi } from '../../services/analyticsApi';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

const CurrentIndicators = () => {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDailyStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await analyticsApi.getDailyStats();
        setStatsData(data);
      } catch (err) {
        console.error('Error loading daily stats:', err);
        setError('Не удалось загрузить данные за сегодня');
        setStatsData(null);
      } finally {
        setLoading(false);
      }
    };

    loadDailyStats();
  }, []);

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₽0';
    const value = typeof amount === 'number' ? amount : parseFloat(amount);
    
    if (value >= 1000000) {
      return `₽${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `₽${(value / 1000).toFixed(0)}k`;
    } else {
      return `₽${value}`;
    }
  };

  const formatNumber = (number) => {
    if (!number && number !== 0) return '0';
    const value = typeof number === 'number' ? number : parseInt(number);
    
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  if (loading) {
    return (
      <AnalyticBlock 
        title="Текущие показатели"
        subtitle="Загрузка данных..."
      >
        <div className="flex items-center justify-center h-32">
          <CircularProgress sx={{ color: '#FEB95A' }} />
        </div>
      </AnalyticBlock>
    );
  }

  if (error) {
    return (
      <AnalyticBlock 
        title="Текущие показатели"
        subtitle="Ошибка загрузки данных"
      >
        <div className="flex items-center justify-center h-32">
          <Alert severity="error" className="w-full">
            {error}
          </Alert>
        </div>
      </AnalyticBlock>
    );
  }

  if (!statsData) {
    return (
      <AnalyticBlock 
        title="Текущие показатели"
        subtitle="Нет данных для отображения"
      >
        <div className="flex items-center justify-center h-32 text-white/60">
          Данные за сегодня отсутствуют
        </div>
      </AnalyticBlock>
    );
  }

  const {
    date,
    total_sales = 0,
    orders_count = 0,
    delivered_amount = 0,
    delivered_count = 0,
    cancelled_count = 0
  } = statsData;

  return (
    <AnalyticBlock 
      title="Текущие показатели"
      subtitle={`По всем маркетплейсам за ${date}`}
    >
      <div className="m-auto flex items-center flex-wrap gap-4">
        {/* Сумма продаж */}
        <CurrentIndicatorCard 
          icon={<BarChartIcon sx={{fontSize: { xs: 50, sm: 40, md: 60 }, fill:"#FEB95A"}}/>}
          data={formatCurrency(total_sales)}
          title={"сумма продаж"}
          tooltip="Общая сумма всех заказов за сегодня"
        />
        
        {/* Заказы */}
        <CurrentIndicatorCard 
          icon={<ShoppingCartIcon sx={{fontSize: { xs: 50, sm: 40, md: 60 }, fill:"#4DFEF1"}}/>}
          data={formatNumber(orders_count)}
          title={"заказы"}
          tooltip="Количество новых заказов за сегодня"
        />
        
        {/* Выкупы */}
        <CurrentIndicatorCard 
          icon={<PriceCheckIcon sx={{fontSize: { xs: 50, sm: 40, md:60 }, fill:"#228FC8"}}/>}
          data={formatCurrency(delivered_amount)}
          title={"выкупы"}
          tooltip={`Сумма доставленных заказов (${delivered_count} шт.)`}
        />
        
        {/* Возвраты */}
        <CurrentIndicatorCard 
          icon={<RemoveShoppingCartIcon sx={{fontSize: { xs: 50, sm: 40, md: 60 }, fill:"#F2C8ED"}}/>}
          data={cancelled_count.toString()}
          title={"возвраты"}
          tooltip="Количество отмененных заказов"
        />
      </div>
    </AnalyticBlock>
  );
};

export default CurrentIndicators;