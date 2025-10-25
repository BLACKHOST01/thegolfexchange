"use client";

import React, { useEffect, useState } from "react";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import Link from "next/link";
import { 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  Clock,
  CheckCircle2
} from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  lowStockProducts: number;
}

interface RecentActivity {
  id: string;
  type: 'order' | 'user' | 'product';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, activityRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/activity')
      ]);

      if (!statsRes.ok || !activityRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const statsData = await statsRes.json();
      const activityData = await activityRes.json();

      setStats(statsData);
      setRecentActivity(activityData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    change, 
    link 
  }: { 
    title: string;
    value: string | number;
    icon: any;
    change?: string;
    link: string;
  }) => (
    <Link href={link}>
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-200 cursor-pointer group">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
            {change && (
              <p className={`text-sm mt-1 ${
                change.startsWith('+') ? 'text-green-600' : 'text-red-600'
              }`}>
                {change}
              </p>
            )}
          </div>
          <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
            <Icon className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>
    </Link>
  );

  const ActivityItem = ({ activity }: { activity: RecentActivity }) => {
    const getIcon = () => {
      switch (activity.type) {
        case 'order':
          return <ShoppingCart className="w-4 h-4 text-green-600" />;
        case 'user':
          return <Users className="w-4 h-4 text-blue-600" />;
        case 'product':
          return <Package className="w-4 h-4 text-purple-600" />;
        default:
          return <Clock className="w-4 h-4 text-gray-600" />;
      }
    };

    const getStatusColor = (status?: string) => {
      switch (status) {
        case 'PENDING':
          return 'bg-yellow-100 text-yellow-800';
        case 'COMPLETED':
          return 'bg-green-100 text-green-800';
        case 'FAILED':
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
        <div className="flex-shrink-0 mt-1">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {activity.title}
          </p>
          <p className="text-sm text-gray-500 truncate">
            {activity.description}
          </p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-400">
              {new Date(activity.timestamp).toLocaleDateString()} • {new Date(activity.timestamp).toLocaleTimeString()}
            </p>
            {activity.status && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(activity.status)}`}>
                {activity.status}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-200 h-32 rounded-xl"></div>
              ))}
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-gray-200 h-80 rounded-xl"></div>
              <div className="bg-gray-200 h-80 rounded-xl"></div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
            </div>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back! Here's what's happening with your store today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            icon={Users}
            change="+12%"
            link="/admin/users"
          />
          <StatCard
            title="Total Products"
            value={stats?.totalProducts || 0}
            icon={Package}
            change="+5%"
            link="/admin/products"
          />
          <StatCard
            title="Total Orders"
            value={stats?.totalOrders || 0}
            icon={ShoppingCart}
            change="+18%"
            link="/admin/orders"
          />
          <StatCard
            title="Total Revenue"
            value={`$${(stats?.totalRevenue || 0).toLocaleString()}`}
            icon={DollarSign}
            change="+22%"
            link="/admin/orders"
          />
        </div>

        {/* Alerts & Quick Stats */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Pending Orders Alert */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-yellow-600 mr-2" />
              <h3 className="text-sm font-medium text-yellow-800">Pending Orders</h3>
            </div>
            <p className="text-2xl font-bold text-yellow-900 mt-2">
              {stats?.pendingOrders || 0}
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              Orders waiting for processing
            </p>
            <Link
              href="/admin/orders?status=PENDING"
              className="inline-block mt-3 text-sm text-yellow-700 hover:text-yellow-800 font-medium"
            >
              Review orders →
            </Link>
          </div>

          {/* Low Stock Alert */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <h3 className="text-sm font-medium text-red-800">Low Stock</h3>
            </div>
            <p className="text-2xl font-bold text-red-900 mt-2">
              {stats?.lowStockProducts || 0}
            </p>
            <p className="text-sm text-red-700 mt-1">
              Products need restocking
            </p>
            <Link
              href="/admin/products?filter=low-stock"
              className="inline-block mt-3 text-sm text-red-700 hover:text-red-800 font-medium"
            >
              Manage inventory →
            </Link>
          </div>

          {/* Quick Actions */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-sm font-medium text-blue-800">Quick Actions</h3>
            </div>
            <div className="mt-3 space-y-2">
              <Link
                href="/admin/products/new"
                className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
              >
                Add New Product
              </Link>
              <Link
                href="/admin/users/new"
                className="block w-full text-center bg-white text-blue-600 border border-blue-600 py-2 px-4 rounded-lg hover:bg-blue-50 transition text-sm font-medium"
              >
                Create User
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity & Performance */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="p-6">
              {recentActivity.length > 0 ? (
                <div className="space-y-1 max-h-80 overflow-y-auto">
                  {recentActivity.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No recent activity</p>
                </div>
              )}
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-sm font-medium text-gray-900">Database</span>
                  </div>
                  <span className="text-sm text-green-600 font-medium">Operational</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-sm font-medium text-gray-900">API Services</span>
                  </div>
                  <span className="text-sm text-green-600 font-medium">Operational</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-sm font-medium text-gray-900">Payment Gateway</span>
                  </div>
                  <span className="text-sm text-green-600 font-medium">Operational</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-sm font-medium text-gray-900">Email Service</span>
                  </div>
                  <span className="text-sm text-green-600 font-medium">Operational</span>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Performance Metrics</h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">99.9%</p>
                    <p className="text-xs text-gray-500">Uptime</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">0.2s</p>
                    <p className="text-xs text-gray-500">Avg. Response</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}