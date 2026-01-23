import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { offlineClient } from '@/components/offlineClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Euro, ShoppingBag, Calendar, Wallet, Download, FileText, User } from 'lucide-react';
import { format, startOfDay, subDays, subYears, isAfter, startOfWeek, startOfMonth, endOfWeek, endOfMonth } from 'date-fns';
import { de } from 'date-fns/locale';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

export default function Analyse() {
  const [timeFilter, setTimeFilter] = useState('7days'); // 'today', '7days', 'month', 'year'
  const [reportType, setReportType] = useState('overview'); // 'overview', 'product', 'seller'
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [selectedSeller, setSelectedSeller] = useState('all');
  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => offlineClient.entities.Sale.list('-date', 1000)
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => offlineClient.entities.Product.list()
  });

  const { data: sellers = [] } = useQuery({
    queryKey: ['sellers'],
    queryFn: () => offlineClient.entities.Seller.list()
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ['purchases'],
    queryFn: () => offlineClient.entities.Purchase.list('-date', 1000)
  });

  // Einnahmen berechnen (Verkaufspreis - Einkaufspreis - Ladeneinkäufe)
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

  // Ladeneinkäufe nach Zeitraum filtern
  const getPurchasesForTimeframe = (timeframe) => {
    const now = new Date();
    return purchases.filter(p => {
      const purchaseDate = new Date(p.date);
      switch(timeframe) {
        case 'today': return isAfter(purchaseDate, today);
        case '7days': return isAfter(purchaseDate, last7Days);
        case 'month': return isAfter(purchaseDate, thisMonth);
        case 'year': return isAfter(purchaseDate, lastYear);
        default: return true;
      }
    });
  };

  // CSV Export
  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Datum,Uhrzeit,Verkäufer,Produkt,Menge (kg),Preis,Zahlungsmethode\n";
    
    filteredSalesByFilters.forEach(sale => {
      sale.items?.forEach(item => {
        const date = format(new Date(sale.date), 'dd.MM.yyyy', { locale: de });
        const time = format(new Date(sale.date), 'HH:mm', { locale: de });
        csvContent += `${date},${time},${sale.seller_name || 'N/A'},${item.product_name},${item.weight_kg.toFixed(3)},${item.total_price.toFixed(2)},${sale.payment_method}\n`;
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `verkaufsbericht_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV-Datei wurde heruntergeladen');
  };

  // PDF Export
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Verkaufsbericht', 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Erstellt am: ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: de })}`, 14, 28);
    doc.text(`Zeitraum: ${timeFilter === 'today' ? 'Heute' : timeFilter === '7days' ? 'Letzte 7 Tage' : timeFilter === 'month' ? 'Dieser Monat' : 'Letztes Jahr'}`, 14, 34);
    
    let y = 45;
    doc.setFontSize(14);
    doc.text('Zusammenfassung', 14, y);
    
    y += 8;
    doc.setFontSize(10);
    doc.text(`Gesamtumsatz: ${filteredRevenue.toFixed(2)} €`, 14, y);
    y += 6;
    doc.text(`Einnahmen: ${filteredProfit.toFixed(2)} €`, 14, y);
    y += 6;
    doc.text(`Anzahl Verkäufe: ${filteredSalesByFilters.length}`, 14, y);
    
    y += 12;
    doc.setFontSize(14);
    doc.text('Top 5 Produkte', 14, y);
    y += 8;
    
    doc.setFontSize(9);
    topProducts.slice(0, 5).forEach((product, index) => {
      doc.text(`${index + 1}. ${product.name}: ${product.revenue.toFixed(2)} €`, 14, y);
      y += 6;
    });
    
    doc.save(`verkaufsbericht_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success('PDF-Datei wurde heruntergeladen');
  };

  // Statistiken berechnen
  const today = startOfDay(new Date());
  const last7Days = subDays(today, 7);
  const thisMonth = startOfMonth(new Date());
  const lastYear = subYears(today, 1);

  const todaySales = sales.filter(s => isAfter(new Date(s.date), today));
  const last7DaysSales = sales.filter(s => isAfter(new Date(s.date), last7Days));
  const thisMonthSales = sales.filter(s => isAfter(new Date(s.date), thisMonth));
  const lastYearSales = sales.filter(s => isAfter(new Date(s.date), lastYear));

  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  const todayRevenue = todaySales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  const last7DaysRevenue = last7DaysSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  const thisMonthRevenue = thisMonthSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  const lastYearRevenue = lastYearSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);

  // Einnahmen (Profit) minus Ladeneinkäufe
  const totalPurchases = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);
  const todayPurchases = getPurchasesForTimeframe('today').reduce((sum, p) => sum + (p.amount || 0), 0);
  const last7DaysPurchases = getPurchasesForTimeframe('7days').reduce((sum, p) => sum + (p.amount || 0), 0);
  const thisMonthPurchases = getPurchasesForTimeframe('month').reduce((sum, p) => sum + (p.amount || 0), 0);
  const lastYearPurchases = getPurchasesForTimeframe('year').reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalProfit = sales.reduce((sum, sale) => sum + calculateProfit(sale), 0) - totalPurchases;
  const todayProfit = todaySales.reduce((sum, sale) => sum + calculateProfit(sale), 0) - todayPurchases;
  const last7DaysProfit = last7DaysSales.reduce((sum, sale) => sum + calculateProfit(sale), 0) - last7DaysPurchases;
  const thisMonthProfit = thisMonthSales.reduce((sum, sale) => sum + calculateProfit(sale), 0) - thisMonthPurchases;
  const lastYearProfit = lastYearSales.reduce((sum, sale) => sum + calculateProfit(sale), 0) - lastYearPurchases;

  // Filter Sales by Product/Seller
  let filteredSalesByFilters = timeFilter === 'today' ? todaySales :
                                timeFilter === '7days' ? last7DaysSales :
                                timeFilter === 'month' ? thisMonthSales :
                                lastYearSales;

  if (selectedProduct !== 'all') {
    filteredSalesByFilters = filteredSalesByFilters.filter(sale =>
      sale.items?.some(item => item.product_id === selectedProduct)
    );
  }

  if (selectedSeller !== 'all') {
    filteredSalesByFilters = filteredSalesByFilters.filter(sale =>
      sale.seller_name === selectedSeller
    );
  }

  const filteredRevenue = filteredSalesByFilters.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  const filteredPurchases = getPurchasesForTimeframe(timeFilter).reduce((sum, p) => sum + (p.amount || 0), 0);
  const filteredProfit = filteredSalesByFilters.reduce((sum, sale) => sum + calculateProfit(sale), 0) - filteredPurchases;

  // Chart-Daten basierend auf Filter
  let chartData = [];
  let filteredSales = filteredSalesByFilters;

  if (timeFilter === 'today') {
    for (let hour = 0; hour < 24; hour++) {
      const hourSales = filteredSalesByFilters.filter(s => new Date(s.date).getHours() === hour);
      const hourPurchases = getPurchasesForTimeframe(timeFilter).filter(p => new Date(p.date).getHours() === hour);
      const revenue = hourSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
      const purchaseAmount = hourPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);
      const profit = hourSales.reduce((sum, sale) => sum + calculateProfit(sale), 0) - purchaseAmount;
      chartData.push({
        label: `${hour}:00`,
        revenue: revenue,
        profit: profit
      });
    }
  } else if (timeFilter === '7days') {
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const daySales = filteredSalesByFilters.filter(s => {
        const saleDate = startOfDay(new Date(s.date));
        return saleDate.getTime() === date.getTime();
      });
      const dayPurchases = getPurchasesForTimeframe(timeFilter).filter(p => {
        const purchaseDate = startOfDay(new Date(p.date));
        return purchaseDate.getTime() === date.getTime();
      });
      const revenue = daySales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
      const purchaseAmount = dayPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);
      const profit = daySales.reduce((sum, sale) => sum + calculateProfit(sale), 0) - purchaseAmount;
      chartData.push({
        label: format(date, 'EEE dd.MM', { locale: de }),
        revenue: revenue,
        profit: profit
      });
    }
  } else if (timeFilter === 'month') {
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(today.getFullYear(), today.getMonth(), day);
      if (date <= new Date()) {
        const daySales = filteredSalesByFilters.filter(s => {
          const saleDate = startOfDay(new Date(s.date));
          return saleDate.getTime() === startOfDay(date).getTime();
        });
        const dayPurchases = getPurchasesForTimeframe(timeFilter).filter(p => {
          const purchaseDate = startOfDay(new Date(p.date));
          return purchaseDate.getTime() === startOfDay(date).getTime();
        });
        const revenue = daySales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
        const purchaseAmount = dayPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);
        const profit = daySales.reduce((sum, sale) => sum + calculateProfit(sale), 0) - purchaseAmount;
        chartData.push({
          label: format(date, 'dd.MM', { locale: de }),
          revenue: revenue,
          profit: profit
        });
      }
    }
  } else if (timeFilter === 'year') {
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
      const monthSales = filteredSalesByFilters.filter(s => {
        const saleDate = new Date(s.date);
        return saleDate >= monthStart && saleDate <= monthEnd;
      });
      const monthPurchases = getPurchasesForTimeframe(timeFilter).filter(p => {
        const purchaseDate = new Date(p.date);
        return purchaseDate >= monthStart && purchaseDate <= monthEnd;
      });
      const revenue = monthSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
      const purchaseAmount = monthPurchases.reduce((sum, p) => sum + (p.amount || 0), 0);
      const profit = monthSales.reduce((sum, sale) => sum + calculateProfit(sale), 0) - purchaseAmount;
      chartData.push({
        label: format(monthStart, 'MMM yy', { locale: de }),
        revenue: revenue,
        profit: profit
      });
    }
  }

  // Top-Produkte nach Umsatz
  const productRevenue = {};
  const productQuantity = {};
  filteredSales.forEach(sale => {
    sale.items?.forEach(item => {
      if (!productRevenue[item.product_name]) {
        productRevenue[item.product_name] = 0;
        productQuantity[item.product_name] = 0;
      }
      productRevenue[item.product_name] += item.total_price;
      productQuantity[item.product_name] += item.weight_kg;
    });
  });

  const topProducts = Object.entries(productRevenue)
    .map(([name, revenue]) => ({ name, revenue, quantity: productQuantity[name] }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Verkäufer-Statistiken
  const sellerStats = {};
  filteredSales.forEach(sale => {
    const seller = sale.seller_name || 'Unbekannt';
    if (!sellerStats[seller]) {
      sellerStats[seller] = { revenue: 0, count: 0, profit: 0 };
    }
    sellerStats[seller].revenue += sale.total_amount || 0;
    sellerStats[seller].count += 1;
    sellerStats[seller].profit += calculateProfit(sale);
  });

  const topSellers = Object.entries(sellerStats)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.revenue - a.revenue);

  // Pie Chart Daten für Produkte
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
  const pieChartData = topProducts.map((product, index) => ({
    name: product.name,
    value: product.revenue,
    color: COLORS[index % COLORS.length]
  }));

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-4 sm:p-6 shadow-lg text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">Berichte & Analysen</h2>
            <p className="text-purple-100 mt-2 text-sm sm:text-base">Detaillierte Verkaufsauswertungen</p>
          </div>
          <div className="flex gap-2 flex-wrap w-full sm:w-auto">
            <Button onClick={exportToCSV} variant="outline" className="bg-white/20 hover:bg-white/30 border-white/40 text-white flex-1 sm:flex-none">
              <Download className="w-4 h-4 mr-2" />
              <span className="whitespace-nowrap">CSV</span>
            </Button>
            <Button onClick={exportToPDF} variant="outline" className="bg-white/20 hover:bg-white/30 border-white/40 text-white flex-1 sm:flex-none">
              <FileText className="w-4 h-4 mr-2" />
              <span className="whitespace-nowrap">PDF</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-white shadow-sm">
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => setTimeFilter('today')}
              variant={timeFilter === 'today' ? 'default' : 'ghost'}
              className={`${timeFilter === 'today' ? 'bg-green-600 hover:bg-green-700 shadow-md' : 'hover:bg-gray-100'}`}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Heute
            </Button>
            <Button
              onClick={() => setTimeFilter('7days')}
              variant={timeFilter === '7days' ? 'default' : 'ghost'}
              className={`${timeFilter === '7days' ? 'bg-green-600 hover:bg-green-700 shadow-md' : 'hover:bg-gray-100'}`}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              7 Tage
            </Button>
            <Button
              onClick={() => setTimeFilter('month')}
              variant={timeFilter === 'month' ? 'default' : 'ghost'}
              className={`${timeFilter === 'month' ? 'bg-green-600 hover:bg-green-700 shadow-md' : 'hover:bg-gray-100'}`}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Monat
            </Button>
            <Button
              onClick={() => setTimeFilter('year')}
              variant={timeFilter === 'year' ? 'default' : 'ghost'}
              className={`${timeFilter === 'year' ? 'bg-green-600 hover:bg-green-700 shadow-md' : 'hover:bg-gray-100'}`}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Jahr
            </Button>
          </div>

          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Produkt filtern</label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle Produkte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Produkte</SelectItem>
                  {products.filter(p => p.active).map(product => (
                    <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Verkäufer filtern</label>
              <Select value={selectedSeller} onValueChange={setSelectedSeller}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle Verkäufer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Verkäufer</SelectItem>
                  {sellers.map(seller => (
                    <SelectItem key={seller.id} value={seller.name}>{seller.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">Einnahmen</p>
                <p className="text-3xl font-bold text-green-900 mt-1">
                  {filteredProfit.toFixed(2)} €
                </p>
              </div>
              <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center shadow-md">
                <Wallet className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 font-medium">Ausgaben</p>
                <p className="text-3xl font-bold text-red-900 mt-1">
                  {(filteredRevenue - filteredProfit).toFixed(2)} €
                </p>
              </div>
              <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center shadow-md">
                <Euro className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 font-medium">Umsatz</p>
                <p className="text-3xl font-bold text-purple-900 mt-1">
                  {filteredRevenue.toFixed(2)} €
                </p>
              </div>
              <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center shadow-md">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Verkäufe</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">{filteredSales.length}</p>
              </div>
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-md">
                <ShoppingBag className="w-7 h-7 text-white" />
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

      {/* Charts - Tabs */}
      <Tabs defaultValue="bar" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="bar">Balkendiagramm</TabsTrigger>
          <TabsTrigger value="line">Liniendiagramm</TabsTrigger>
          <TabsTrigger value="pie">Kreisdiagramm</TabsTrigger>
        </TabsList>

        <TabsContent value="bar">
          <Card>
            <CardHeader>
              <CardTitle>Umsatz- & Gewinnentwicklung</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => `${value.toFixed(2)} €`}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#8b5cf6" name="Umsatz" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="profit" fill="#10b981" name="Gewinn" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="line">
          <Card>
            <CardHeader>
              <CardTitle>Umsatztrend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => `${value.toFixed(2)} €`}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    name="Umsatz"
                    dot={{ fill: '#8b5cf6', r: 5 }}
                    activeDot={{ r: 8 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    name="Gewinn"
                    dot={{ fill: '#10b981', r: 5 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pie">
          <Card>
            <CardHeader>
              <CardTitle>Produktverteilung (Top 5)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => {
                      let displayName = name;
                      if (name === 'Schoko Crunchy') displayName = 'Crunchy';
                      else if (name === 'Sanddorn Gummibärchen') displayName = 'Gummibärchen';
                      return `${displayName}: ${(percent * 100).toFixed(0)}%`;
                    }}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value.toFixed(2)} €`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detailed Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Top Produkte nach Umsatz
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
                      <div className="text-2xl w-10 text-center">
                        {medals[index] || `${index + 1}.`}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <span className="font-semibold text-gray-900">{product.name}</span>
                            <p className="text-xs text-gray-500">{(product.quantity * 1000).toFixed(0)}g verkauft</p>
                          </div>
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
              {topProducts.length === 0 && (
                <p className="text-center text-gray-500 py-8">Keine Daten verfügbar</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Sellers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Verkäufer-Leistung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topSellers.map((seller, index) => {
                const maxRevenue = topSellers[0]?.revenue || 1;
                const percentage = (seller.revenue / maxRevenue) * 100;
                return (
                  <Card key={index} className="p-4 hover:shadow-md transition-shadow bg-gradient-to-r from-white to-blue-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <span className="font-semibold text-gray-900">{seller.name}</span>
                            <p className="text-xs text-gray-500">{seller.count} Verkäufe • {seller.profit.toFixed(2)}€ Gewinn</p>
                          </div>
                          <span className="text-blue-600 font-bold text-lg">{seller.revenue.toFixed(2)} €</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
              {topSellers.length === 0 && (
                <p className="text-center text-gray-500 py-8">Keine Daten verfügbar</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}