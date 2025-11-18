import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { Navigation } from "@/components/Navigation";

interface Transaction {
  id: string;
  type: 'payment_intent' | 'charge' | 'invoice';
  amount: number;
  currency: string;
  status: string;
  created: number;
  customer_email?: string | null;
  customer_id?: string | null;
  description?: string | null;
  invoice_url?: string | null;
  receipt_url?: string | null;
  invoice_pdf?: string | null;
  subscription_id?: string | null;
}

const AdminPaymentHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Check if user is master admin
    if (user.email !== "rodspike2k8@gmail.com") {
      toast.error("Unauthorized access");
      navigate("/dashboard");
      return;
    }
  }, [user, navigate]);

  const fetchPaymentHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-payment-history', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data.success) {
        setTransactions(data.transactions);
        toast.success(`Loaded ${data.total_count} transactions`);
      } else {
        throw new Error(data.error || 'Failed to fetch payment history');
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.email === "rodspike2k8@gmail.com") {
      fetchPaymentHistory();
    }
  }, [user]);

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      succeeded: 'bg-green-500',
      paid: 'bg-green-500',
      active: 'bg-green-500',
      pending: 'bg-yellow-500',
      processing: 'bg-yellow-500',
      requires_payment_method: 'bg-orange-500',
      requires_confirmation: 'bg-orange-500',
      requires_action: 'bg-orange-500',
      canceled: 'bg-gray-500',
      failed: 'bg-red-500',
      draft: 'bg-gray-400',
      open: 'bg-blue-500',
      void: 'bg-gray-500',
      uncollectible: 'bg-red-500',
    };

    const color = statusColors[status] || 'bg-gray-500';

    return (
      <Badge className={`${color} text-white`}>
        {status}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeColors: Record<string, string> = {
      payment_intent: 'bg-blue-500',
      charge: 'bg-purple-500',
      invoice: 'bg-indigo-500',
    };

    const color = typeColors[type] || 'bg-gray-500';

    return (
      <Badge className={`${color} text-white`}>
        {type.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl">Payment History</CardTitle>
                <CardDescription>
                  View all Stripe transactions and payment details
                </CardDescription>
              </div>
              <Button onClick={fetchPaymentHistory} disabled={loading}>
                <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No transactions found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Links</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(transaction.created)}
                        </TableCell>
                        <TableCell>
                          {getTypeBadge(transaction.type)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(transaction.status)}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate">
                            {transaction.customer_email || transaction.customer_id || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatAmount(transaction.amount, transaction.currency)}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate">
                            {transaction.description || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {transaction.invoice_url && (
                              <Button
                                size="sm"
                                variant="outline"
                                asChild
                              >
                                <a
                                  href={transaction.invoice_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Invoice
                                </a>
                              </Button>
                            )}
                            {transaction.receipt_url && (
                              <Button
                                size="sm"
                                variant="outline"
                                asChild
                              >
                                <a
                                  href={transaction.receipt_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Receipt
                                </a>
                              </Button>
                            )}
                            {transaction.invoice_pdf && (
                              <Button
                                size="sm"
                                variant="outline"
                                asChild
                              >
                                <a
                                  href={transaction.invoice_pdf}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  PDF
                                </a>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPaymentHistory;
