import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Euro, ShoppingBag, Calendar } from 'lucide-react';
import { format, startOfDay, subDays, isAfter } from 'date-fns';
import { de } from 'date-fns/locale';

export default function Analyse() {
  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-date', 1000)
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list()
  });

  // Statistiken berechnen
  const today = startOfDay(new Date());
  const last7Days = subDays(today, 7);
  const last30Days = subDays(today, 30);

  const todaySales = sales.filter(s => isAfter(new Date(s.date), today));
  const last7DaysSales = sales.filter(s => isAfter(new Date(s.date), last7Days));
  const last30DaysSales = sales.filter(s => isAfter(new Date(s.date), last30Days));

  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  const todayRevenue = todaySales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  const last7DaysRevenue = last7DaysSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);

  // Top-Produkte nach Umsatz
  const productRevenue = {};
  sales.forEach(sale => {
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

  // Verkäufe nach Kategorie
  const categoryRevenue = {};
  sales.forEach(sale => {
    sale.items?.forEach(item => {
      const product = products.find(p => p.id === item.product_id);
      const category = product?.category || 'Sonstiges';
      if (!categoryRevenue[category]) {
        categoryRevenue[category] = 0;
      }
      categoryRevenue[category] += item.total_price;
    });
  });

  const categoryData = Object.entries(categoryRevenue)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const COLORS = ['#10b981', '#059669', '#047857', '#065f46', '#064e3b', '#6ee7b7', '#34d399'];

  // Verkäufe der letzten 7 Tage
  const dailyRevenue = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(today, i);
    const daySales = sales.filter(s => {
      const saleDate = startOfDay(new Date(s.date));
      return saleDate.getTime() === date.getTime();
    });
    const revenue = daySales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
    dailyRevenue.push({
      date: format(date, 'EEE', { locale: de }),
      revenue: revenue
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Analyse & Statistiken</h2>
        <p className="text-gray-600 mt-1">Übersicht über Verkäufe und Umsätze</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <p className="text-sm text-gray-600">Gesamt</p>
                <p className="text-2xl font-bold text-gray-900">{totalRevenue.toFixed(2)} €</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Verkäufe</p>
                <p className="text-2xl font-bold text-gray-900">{sales.length}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Daily Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Umsatz letzte 7 Tage</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toFixed(2)} €`} />
                <Bar dataKey="revenue" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Umsatz nach Kategorie</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value.toFixed(2)} €`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

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