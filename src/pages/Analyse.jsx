import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { offlineClient } from '@/components/offlineClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, TrendingUp, TrendingDown, DollarSign, Receipt, FileText, Calendar, ArrowUpRight, ArrowDownRight, Download, PieChart as PieChartIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, subMonths } from 'date-fns';
import { de } from 'date-fns/locale';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Buchhaltung() {
  const [selectedPeriod, setSelectedPeriod] = useState('month'); // 'month', 'quarter', 'year'
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear] = useState(new Date().getFullYear());

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => offlineClient.entities.Sale.list('-date', 1000)
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ['purchases'],
    queryFn: () => offlineClient.entities.Purchase.list('-date', 1000)
  });

  const { data: cashEntries = [] } = useQuery({
    queryKey: ['cashRegister'],
    queryFn: () => offlineClient.entities.CashRegister.list('-date', 1000)
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => offlineClient.entities.Product.list()
  });

  // Berechne Einnahmen und Ausgaben für einen Zeitraum
  const calculateFinancials = (startDate, endDate) => {
    // Einnahmen aus Verkäufen
    const periodSales = sales.filter(s => {
      const saleDate = new Date(s.date);
      return saleDate >= startDate && saleDate <= endDate;
    });

    const revenue = periodSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);

    // Ausgaben (Wareneinkauf + Kosten)
    const periodPurchases = purchases.filter(p => {
      const purchaseDate = new Date(p.date);
      return purchaseDate >= startDate && purchaseDate <= endDate;
    });

    const expenses = periodPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);

    // COGS (Cost of Goods Sold) - Wareneinsatz
    let cogs = 0;
    periodSales.forEach(sale => {
      sale.items?.forEach(item => {
        const product = products.find(p => p.id === item.product_id);
        if (product && product.purchase_price_per_kg) {
          cogs += item.weight_kg * product.purchase_price_per_kg;
        }
      });
    });

    const grossProfit = revenue - cogs;
    const netProfit = revenue - cogs - expenses;

    return { revenue, expenses, cogs, grossProfit, netProfit, salesCount: periodSales.length };
  };

  // Aktueller Monat
  const currentMonthStart = startOfMonth(new Date(selectedYear, selectedMonth));
  const currentMonthEnd = endOfMonth(new Date(selectedYear, selectedMonth));
  const currentMonth = calculateFinancials(currentMonthStart, currentMonthEnd);

  // Vormonat
  const lastMonthStart = startOfMonth(subMonths(currentMonthStart, 1));
  const lastMonthEnd = endOfMonth(subMonths(currentMonthStart, 1));
  const lastMonth = calculateFinancials(lastMonthStart, lastMonthEnd);

  // Jahresübersicht
  const yearStart = startOfYear(new Date(selectedYear, 0));
  const yearEnd = new Date(selectedYear, 11, 31);
  const yearData = calculateFinancials(yearStart, yearEnd);

  // Monatlicher Trend (letzte 12 Monate)
  const monthlyTrend = [];
  for (let i = 11; i >= 0; i--) {
    const monthDate = subMonths(new Date(), i);
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    const data = calculateFinancials(start, end);
    monthlyTrend.push({
      month: format(monthDate, 'MMM yy', { locale: de }),
      revenue: data.revenue,
      expenses: data.expenses + data.cogs,
      profit: data.netProfit
    });
  }

  // Ausgaben-Aufschlüsselung
  const expenseCategories = [
    { name: 'Wareneinkauf', value: currentMonth.cogs, color: '#3b82f6' },
    { name: 'Sonstige Ausgaben', value: currentMonth.expenses, color: '#ef4444' }
  ];

  // Zahlungsmethoden-Verteilung
  const paymentMethods = {};
  sales.forEach(sale => {
    if (!paymentMethods[sale.payment_method]) {
      paymentMethods[sale.payment_method] = 0;
    }
    paymentMethods[sale.payment_method] += sale.total_amount || 0;
  });

  const paymentData = Object.entries(paymentMethods).map(([method, amount]) => ({
    name: method,
    value: amount,
    color: method === 'Bargeld' ? '#10b981' : '#8b5cf6'
  }));

  // Veränderungen zum Vormonat
  const revenueChange = lastMonth.revenue > 0 ? ((currentMonth.revenue - lastMonth.revenue) / lastMonth.revenue) * 100 : 0;
  const profitChange = lastMonth.netProfit > 0 ? ((currentMonth.netProfit - lastMonth.netProfit) / lastMonth.netProfit) * 100 : 0;

  const months = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 rounded-2xl p-6 shadow-xl text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <BookOpen className="w-8 h-8" />
              Buchhaltung
            </h2>
            <p className="text-slate-300 mt-2">Professionelle Finanzverwaltung & Reporting</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-white/10 hover:bg-white/20 border-white/30 text-white">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Zeitraum-Auswahl */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3 items-center flex-wrap">
            <label className="text-sm font-medium">Monat:</label>
            <Select value={selectedMonth.toString()} onValueChange={(val) => setSelectedMonth(parseInt(val))}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month, index) => (
                  <SelectItem key={index} value={index.toString()}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-600">
              {format(currentMonthStart, 'dd.MM.yyyy', { locale: de })} - {format(currentMonthEnd, 'dd.MM.yyyy', { locale: de })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Umsatz */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Umsatz</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">
                  {currentMonth.revenue.toFixed(2)} €
                </p>
                <div className={`flex items-center gap-1 mt-2 text-sm ${revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {revenueChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  <span className="font-medium">{Math.abs(revenueChange).toFixed(1)}%</span>
                  <span className="text-gray-600">vs. Vormonat</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ausgaben */}
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Ausgaben</p>
                <p className="text-3xl font-bold text-red-900 mt-2">
                  {(currentMonth.cogs + currentMonth.expenses).toFixed(2)} €
                </p>
                <div className="mt-2 text-sm text-gray-600">
                  <span>Wareneinsatz: {currentMonth.cogs.toFixed(2)} €</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bruttogewinn */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Bruttogewinn</p>
                <p className="text-3xl font-bold text-green-900 mt-2">
                  {currentMonth.grossProfit.toFixed(2)} €
                </p>
                <div className="mt-2 text-sm text-gray-600">
                  <span>Marge: {currentMonth.revenue > 0 ? ((currentMonth.grossProfit / currentMonth.revenue) * 100).toFixed(1) : 0}%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nettogewinn */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Nettogewinn</p>
                <p className="text-3xl font-bold text-purple-900 mt-2">
                  {currentMonth.netProfit.toFixed(2)} €
                </p>
                <div className={`flex items-center gap-1 mt-2 text-sm ${profitChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {profitChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  <span className="font-medium">{Math.abs(profitChange).toFixed(1)}%</span>
                  <span className="text-gray-600">vs. Vormonat</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <Receipt className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gewinn- und Verlustrechnung (GuV) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Gewinn- und Verlustrechnung (GuV)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Einnahmen */}
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <span className="font-semibold text-gray-900">Betriebseinnahmen</span>
              <span className="text-xl font-bold text-blue-900">{currentMonth.revenue.toFixed(2)} €</span>
            </div>

            {/* Wareneinsatz */}
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg pl-8">
              <span className="text-gray-700">Wareneinsatz (COGS)</span>
              <span className="text-lg font-medium text-red-700">- {currentMonth.cogs.toFixed(2)} €</span>
            </div>

            {/* Bruttogewinn */}
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
              <span className="font-semibold text-gray-900">Bruttogewinn</span>
              <span className="text-xl font-bold text-green-900">{currentMonth.grossProfit.toFixed(2)} €</span>
            </div>

            {/* Betriebsausgaben */}
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg pl-8">
              <span className="text-gray-700">Betriebsausgaben</span>
              <span className="text-lg font-medium text-red-700">- {currentMonth.expenses.toFixed(2)} €</span>
            </div>

            {/* Nettogewinn */}
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-100 to-purple-50 rounded-lg border-2 border-purple-300">
              <span className="font-bold text-lg text-gray-900">Nettogewinn</span>
              <span className="text-2xl font-bold text-purple-900">{currentMonth.netProfit.toFixed(2)} €</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monatlicher Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Finanzieller Trend (12 Monate)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" style={{ fontSize: '12px' }} />
                <YAxis style={{ fontSize: '12px' }} />
                <Tooltip 
                  formatter={(value) => `${value.toFixed(2)} €`}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Umsatz" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} name="Gewinn" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Ausgaben-Verteilung */}
        <Card>
          <CardHeader>
            <CardTitle>Ausgaben-Verteilung</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value.toFixed(2)} €`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Jahresübersicht */}
      <Card className="bg-gradient-to-r from-slate-50 to-gray-100 border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Jahresübersicht {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Jahresumsatz</p>
              <p className="text-2xl font-bold text-blue-700">{yearData.revenue.toFixed(2)} €</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Jahresausgaben</p>
              <p className="text-2xl font-bold text-red-700">{(yearData.cogs + yearData.expenses).toFixed(2)} €</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Bruttogewinn</p>
              <p className="text-2xl font-bold text-green-700">{yearData.grossProfit.toFixed(2)} €</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <p className="text-sm text-gray-600 mb-1">Nettogewinn</p>
              <p className="text-2xl font-bold text-purple-700">{yearData.netProfit.toFixed(2)} €</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zahlungsmethoden */}
      <Card>
        <CardHeader>
          <CardTitle>Umsatz nach Zahlungsmethode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paymentData.map((method, index) => (
              <div key={index} className="p-4 bg-gradient-to-r from-white to-gray-50 rounded-lg border shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">{method.name}</span>
                  <span className="text-2xl font-bold" style={{ color: method.color }}>
                    {method.value.toFixed(2)} €
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}