import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
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
    queryFn: () => base44.entities.Sale.list('-date', 1000)
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list()
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
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Analyse & Statistiken</h2>
        <p className="text-gray-600 mt-1">Übersicht über Verkäufe und Umsätze</p>
      </div>

      {/* Time Filter */}
      <div className="flex gap-3">
        <Button
          onClick={() => setTimeFilter('today')}
          variant={timeFilter === 'today' ? 'default' : 'outline'}
          className={timeFilter === 'today' ? 'bg-green-600' : ''}
        >
          Heute
        </Button>
        <Button
          onClick={() => setTimeFilter('7days')}
          variant={timeFilter === '7days' ? 'default' : 'outline'}
          className={timeFilter === '7days' ? 'bg-green-600' : ''}
        >
          Letzte 7 Tage
        </Button>
        <Button
          onClick={() => setTimeFilter('year')}
          variant={timeFilter === 'year' ? 'default' : 'outline'}
          className={timeFilter === 'year' ? 'bg-green-600' : ''}
        >
          Letztes Jahr
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Heute</p>
                <p className="text-2xl font-bold text-gray-900">{todayRevenue.toFixed(2)} €</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Euro className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Letzte 7 Tage</p>
                <p className="text-2xl font-bold text-gray-900">{last7DaysRevenue.toFixed(2)} €</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Letztes Jahr</p>
                <p className="text-2xl font-bold text-gray-900">{lastYearRevenue.toFixed(2)} €</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700">Einnahmen</p>
                <p className="text-2xl font-bold text-amber-900">
                  {timeFilter === 'today' ? todayProfit.toFixed(2) : 
                   timeFilter === '7days' ? last7DaysProfit.toFixed(2) : 
                   lastYearProfit.toFixed(2)} €
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Verkäufe</p>
                <p className="text-2xl font-bold text-gray-900">{filteredSales.length}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
          <CardTitle>Top 5 Produkte nach Umsatz</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topProducts.map((product, index) => {
              const maxRevenue = topProducts[0]?.revenue || 1;
              const percentage = (product.revenue / maxRevenue) * 100;
              return (
                <div key={index}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{product.name}</span>
                    <span className="text-green-600 font-semibold">{product.revenue.toFixed(2)} €</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}