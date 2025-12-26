import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { offlineClient } from '../components/offlineClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Euro, ShoppingBag, Calendar, Wallet } from 'lucide-react';
import { format, startOfDay, subDays, subYears, isAfter } from 'date-fns';
import { de } from 'date-fns/locale';

export default function Analyse() {
  const [timeFilter, setTimeFilter] = useState('7days'); // 'today', '7days', 'year'
  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => offlineClient.entities.Sale.list('-date', 1000)
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => offlineClient.entities.Product.list()
  });

  // Einnahmen berechnen (Verkaufspreis - Einkaufspreis)
  const calculateProfit = (sale) => {
    let profit = 0;
    sale.items?.forEach(item => {
      const product = products.find(p => p.id === item.product_id);
      if (product && product.purchase_price_per_kg) {
        const cost = item.weight_kg * product.purchase_price_per_kg;
        profit += (item.total_price - cost);
      } else {
        profit += item.total_price;
      }
    });
    return profit;
  };

  // Statistiken berechnen
  const today = startOfDay(new Date());
  const last7Days = subDays(today, 7);
  const lastYear = subYears(today, 1);

  const todaySales = sales.filter(s => isAfter(new Date(s.date), today));
  const last7DaysSales = sales.filter(s => isAfter(new Date(s.date), last7Days));
  const lastYearSales = sales.filter(s => isAfter(new Date(s.date), lastYear));

  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  const todayRevenue = todaySales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  const last7DaysRevenue = last7DaysSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  const lastYearRevenue = lastYearSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);

  // Einnahmen (Profit)
  const totalProfit = sales.reduce((sum, sale) => sum + calculateProfit(sale), 0);
  const todayProfit = todaySales.reduce((sum, sale) => sum + calculateProfit(sale), 0);
  const last7DaysProfit = last7DaysSales.reduce((sum, sale) => sum + calculateProfit(sale), 0);
  const lastYearProfit = lastYearSales.reduce((sum, sale) => sum + calculateProfit(sale), 0);

  // Chart-Daten basierend auf Filter
  let chartData = [];
  let filteredSales = sales;

  if (timeFilter === 'today') {
    filteredSales = todaySales;
    // Stunden des Tages
    for (let hour = 0; hour < 24; hour++) {
      const hourSales = todaySales.filter(s => new Date(s.date).getHours() === hour);
      const revenue = hourSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
      chartData.push({
        label: `${hour}:00`,
        revenue: revenue
      });
    }
  } else if (timeFilter === '7days') {
    filteredSales = last7DaysSales;
    // Letzte 7 Tage
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const daySales = sales.filter(s => {
        const saleDate = startOfDay(new Date(s.date));
        return saleDate.getTime() === date.getTime();
      });
      const revenue = daySales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
      chartData.push({
        label: format(date, 'EEE dd.MM', { locale: de }),
        revenue: revenue
      });
    }
  } else if (timeFilter === 'year') {
    filteredSales = lastYearSales;
    // Letzte 12 Monate
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
      const monthSales = sales.filter(s => {
        const saleDate = new Date(s.date);
        return saleDate >= monthStart && saleDate <= monthEnd;
      });
      const revenue = monthSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
      chartData.push({
        label: format(monthStart, 'MMM', { locale: de }),
        revenue: revenue
      });
    }
  }

  // Top-Produkte nach Umsatz
  const productRevenue = {};
  filteredSales.forEach(sale => {
    sale.items?.forEach(item => {
      if (!productRevenue[item.product_name]) {
        productRevenue[item.product_name] = 0;
      }
      productRevenue[item.product_name] += item.total_price;
    });
  });

  const topProducts = Object.entries(productRevenue)
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 shadow-lg text-white">
        <h2 className="text-3xl font-bold">Analyse & Statistiken</h2>
        <p className="text-purple-100 mt-2">Übersicht über Verkäufe und Umsätze</p>
      </div>

      {/* Time Filter */}
      <Card className="p-2 bg-white shadow-sm">
        <div className="flex gap-2">
          <Button
            onClick={() => setTimeFilter('today')}
            variant={timeFilter === 'today' ? 'default' : 'ghost'}
            className={`flex-1 ${timeFilter === 'today' ? 'bg-green-600 hover:bg-green-700 shadow-md' : 'hover:bg-gray-100'}`}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Heute
          </Button>
          <Button
            onClick={() => setTimeFilter('7days')}
            variant={timeFilter === '7days' ? 'default' : 'ghost'}
            className={`flex-1 ${timeFilter === '7days' ? 'bg-green-600 hover:bg-green-700 shadow-md' : 'hover:bg-gray-100'}`}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Letzte 7 Tage
          </Button>
          <Button
            onClick={() => setTimeFilter('year')}
            variant={timeFilter === 'year' ? 'default' : 'ghost'}
            className={`flex-1 ${timeFilter === 'year' ? 'bg-green-600 hover:bg-green-700 shadow-md' : 'hover:bg-gray-100'}`}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Letztes Jahr
          </Button>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Einnahmen</p>
                <p className="text-2xl font-bold text-green-900">
                  {timeFilter === 'today' ? todayProfit.toFixed(2) : 
                   timeFilter === '7days' ? last7DaysProfit.toFixed(2) : 
                   lastYearProfit.toFixed(2)} €
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700">Ausgaben</p>
                <p className="text-2xl font-bold text-red-900">
                  {timeFilter === 'today' ? (todayRevenue - todayProfit).toFixed(2) : 
                   timeFilter === '7days' ? (last7DaysRevenue - last7DaysProfit).toFixed(2) : 
                   (lastYearRevenue - lastYearProfit).toFixed(2)} €
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Euro className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700">Umsatz</p>
                <p className="text-2xl font-bold text-purple-900">
                  {timeFilter === 'today' ? todayRevenue.toFixed(2) : 
                   timeFilter === '7days' ? last7DaysRevenue.toFixed(2) : 
                   lastYearRevenue.toFixed(2)} €
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Verkäufe</p>
                <p className="text-2xl font-bold text-blue-900">{filteredSales.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gesamtübersicht */}
      <Card className="bg-gradient-to-r from-slate-50 to-gray-100 border-2 border-gray-300">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Gesamtübersicht (alle Zeiträume)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Einnahmen</p>
              <p className="text-xl font-bold text-green-700">{totalProfit.toFixed(2)} €</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Ausgaben</p>
              <p className="text-xl font-bold text-red-700">{(totalRevenue - totalProfit).toFixed(2)} €</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Umsatz</p>
              <p className="text-xl font-bold text-purple-700">{totalRevenue.toFixed(2)} €</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Verkäufe</p>
              <p className="text-xl font-bold text-blue-700">{sales.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>
            Umsatz {timeFilter === 'today' ? 'heute' : timeFilter === '7days' ? 'letzte 7 Tage' : 'letztes Jahr'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip formatter={(value) => `${value.toFixed(2)} €`} />
              <Bar dataKey="revenue" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Top 5 Produkte nach Umsatz
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topProducts.map((product, index) => {
              const maxRevenue = topProducts[0]?.revenue || 1;
              const percentage = (product.revenue / maxRevenue) * 100;
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <Card key={index} className="p-4 hover:shadow-md transition-shadow bg-gradient-to-r from-white to-green-50">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl w-8 text-center">
                      {medals[index] || `${index + 1}.`}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-900">{product.name}</span>
                        <span className="text-green-600 font-bold text-lg">{product.revenue.toFixed(2)} €</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}