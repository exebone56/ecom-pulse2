import React, { useState, useEffect } from 'react';
import AnalyticBlock from '../AnalyticBlock';
import DebouncedChart from '../Charts/DebouncedChart';
import { analyticsApi } from '../../services/analyticsApi';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import Alert from '@mui/material/Alert';

const RevenueChartDays = () => {
  const [selectedMarketplace, setSelectedMarketplace] = useState('all');
  const [marketplaces, setMarketplaces] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadMarketplaces = async () => {
      try {
        setMarketplaces([
          { id: 'all', name: 'Все маркетплейсы', color: '#6366F1' },
          { id: '1', name: 'Wildberries', color: '#FF6B6B' },
          { id: '2', name: 'OZON', color: '#005BFF' },
          { id: '3', name: 'Яндекс.Маркет', color: '#FFD700' },
        ]);
      } catch (err) {
        console.error('Error loading marketplaces:', err);
      }
    };
    
    loadMarketplaces();
  }, []);

  const loadChartData = async (marketplaceId) => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsApi.getRevenueDailyData(marketplaceId);
      setChartData(data);
    } catch (err) {
      setError('Не удалось загрузить данные о выручке');
      setChartData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (marketplaces.length > 0) {
      loadChartData(selectedMarketplace);
    }
  }, [selectedMarketplace, marketplaces]);

  const handleMarketplaceChange = (event) => {
    setSelectedMarketplace(event.target.value);
  };

  const getChartColor = () => {
    const selected = marketplaces.find(mp => mp.id === selectedMarketplace);
    return selected ? selected.color : '#6366F1';
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0';
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <AnalyticBlock
      title="График выручки по дням"
      subtitle={
        <div className="flex items-center justify-between w-full">
          <span>
            {chartData?.month ? `За ${chartData.month}` : 'По всем маркетплейсам'}
          </span>
          {chartData?.total_revenue && (
            <span className="text-[#FEB95A] font-semibold text-sm">
              Всего: ₽{formatCurrency(chartData.total_revenue)}
            </span>
          )}
        </div>
      }
    >
      <div className="flex flex-col h-full">
        {/* Заголовок с селектором */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-white/60">
            Выберите маркетплейс для анализа
          </div>
          
          {/* Компактный белый селектор */}
          <FormControl size="small" className="w-48">
            <InputLabel 
              id="marketplace-select-label"
              sx={{
                color: 'white',
                '&.Mui-focused': {
                  color: 'white',
                },
              }}
            >
              Маркетплейс
            </InputLabel>
            <Select
              labelId="marketplace-select-label"
              value={selectedMarketplace}
              onChange={handleMarketplaceChange}
              label="Маркетплейс"
              sx={{
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.7)',
                },
                '& .MuiSelect-icon': {
                  color: 'white',
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: '#2B2B36',
                    color: 'white',
                    '& .MuiMenuItem-root': {
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      },
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(99, 102, 241, 0.3)',
                      },
                      '&.Mui-selected:hover': {
                        backgroundColor: 'rgba(99, 102, 241, 0.4)',
                      },
                    },
                  },
                },
              }}
            >
              {marketplaces.map((marketplace) => (
                <MenuItem key={marketplace.id} value={marketplace.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: marketplace.color }}
                    />
                    <span className="text-sm">{marketplace.name}</span>
                  </div>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        {/* Информация о выбранном маркетплейсе */}
        <div className="mb-4">
          {selectedMarketplace !== 'all' && (
            <div className="flex items-center gap-2 text-sm text-white/80">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: getChartColor() }}
              />
              <span>
                Показаны данные для: <strong>{marketplaces.find(mp => mp.id === selectedMarketplace)?.name}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Состояния загрузки и ошибок */}
        {loading && (
          <div className="flex items-center justify-center h-48">
            <CircularProgress sx={{ color: '#FEB95A' }} />
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-48">
            <Alert severity="error" className="w-full">
              {error}
            </Alert>
          </div>
        )}

        {/* График */}
        {chartData && !loading && !error && (
          <div className="flex-1 min-h-0">
            <DebouncedChart 
              data={chartData.revenue_data}
              xAxisData={chartData.days}
              xAxisLabel="День"
              height={200}
              seriesLabel="Выручка"
              color={getChartColor()}
              margin={{ left: 0, right: 20, top: 20, bottom: 0 }}
              formatter={(value) => `₽${formatCurrency(value)}`}
            />
          </div>
        )}

        {/* Сообщение если нет данных */}
        {!chartData && !loading && !error && (
          <div className="flex items-center justify-center h-48 text-white/60">
            Нет данных для отображения
          </div>
        )}
      </div>
    </AnalyticBlock>
  );
};

export default RevenueChartDays;