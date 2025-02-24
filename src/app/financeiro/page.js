'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, MinusCircle } from 'lucide-react';
import { firebaseApp } from '../../../firebaseConfig';
import { 
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  Timestamp 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

// Categorias disponíveis para cada tipo de transação
const TRANSACTION_CATEGORIES = {
  income: [
    { value: 'salary', label: 'Salário' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'investment', label: 'Investimento' },
    { value: 'other', label: 'Outros' }
  ],
  expense: [
    { value: 'food', label: 'Alimentação' },
    { value: 'transport', label: 'Transporte' },
    { value: 'housing', label: 'Moradia' },
    { value: 'utilities', label: 'Contas' },
    { value: 'health', label: 'Saúde' },
    { value: 'education', label: 'Educação' },
    { value: 'leisure', label: 'Lazer' },
    { value: 'other', label: 'Outros' }
  ]
};

// Função auxiliar para obter o label da categoria
const getCategoryLabel = (type, categoryValue) => {
  const categories = TRANSACTION_CATEGORIES[type] || [];
  const category = categories.find(cat => cat.value === categoryValue);
  return category ? category.label : categoryValue;
};

const FinancialDashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [transactionFilter, setTransactionFilter] = useState('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState('');
  const [transactionDetails, setTransactionDetails] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    category: ''
  });

  const months = [
    { value: "0", label: "Janeiro" },
    { value: "1", label: "Fevereiro" },
    { value: "2", label: "Março" },
    { value: "3", label: "Abril" },
    { value: "4", label: "Maio" },
    { value: "5", label: "Junho" },
    { value: "6", label: "Julho" },
    { value: "7", label: "Agosto" },
    { value: "8", label: "Setembro" },
    { value: "9", label: "Outubro" },
    { value: "10", label: "Novembro" },
    { value: "11", label: "Dezembro" }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => (currentYear - i).toString());

  // Atualiza as transações filtradas quando o filtro ou as transações mudam
  useEffect(() => {
    if (transactionFilter === 'all') {
      setFilteredTransactions(transactions);
    } else {
      setFilteredTransactions(transactions.filter(t => t.type === transactionFilter));
    }
  }, [transactionFilter, transactions]);

  // Carregar dados quando o usuário estiver autenticado
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchTransactions();
      } else {
        setLoading(false);
        setError('Usuário não está logado');
      }
    });

    return () => unsubscribe();
  }, [selectedMonth, selectedYear]);

  const fetchTransactions = async () => {
    try {
      if (!auth.currentUser) {
        setError('Usuário não está logado');
        return;
      }

      setLoading(true);
      
      const userDocRef = doc(db, 'usuario', auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Se o documento não existe, cria com array vazio
        await setDoc(userDocRef, { financial: [] }, { merge: true });
        setTransactions([]);
        calculateTotals([]);
        return;
      }
      
      const userData = userDoc.data();
      const financialData = userData.financial || [];
      
      const filteredTransactions = financialData.filter(transaction => {
        if (!transaction.date) return false;
        const transactionDate = transaction.date.toDate();
        return (
          transactionDate.getMonth() === parseInt(selectedMonth) &&
          transactionDate.getFullYear() === parseInt(selectedYear)
        );
      });

      setTransactions(filteredTransactions);
      calculateTotals(filteredTransactions);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (data) => {
    const income = data
      .filter(t => t.type === 'income')
      .reduce((acc, curr) => acc + curr.amount, 0);
    
    const expenses = data
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => acc + curr.amount, 0);

    setTotalIncome(income);
    setTotalExpenses(expenses);
  };

  const handleOpenModal = (type) => {
    setTransactionType(type);
    setTransactionDetails({
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      category: ''
    });
    setIsModalOpen(true);
  };

  const handleAddTransaction = async () => {
    try {
      if (!auth.currentUser) {
        setError('Usuário não está logado');
        return;
      }

      if (!transactionDetails.amount || !transactionDetails.description || !transactionDetails.category) {
        setError('Por favor, preencha todos os campos');
        return;
      }

      const userDocRef = doc(db, 'usuario', auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      const newTransaction = {
        ...transactionDetails,
        amount: parseFloat(transactionDetails.amount),
        type: transactionType,
        date: Timestamp.fromDate(new Date(transactionDetails.date)),
        id: Date.now().toString()
      };

      if (!userDoc.exists()) {
        // Se o documento não existe, cria com a primeira transação
        await setDoc(userDocRef, {
          financial: [newTransaction]
        });
      } else {
        // Se existe, adiciona a nova transação ao array
        await updateDoc(userDocRef, {
          financial: arrayUnion(newTransaction)
        });
      }

      setIsModalOpen(false);
      setError('');
      fetchTransactions();
    } catch (err) {
      console.error('Erro ao adicionar transação:', err);
      setError('Erro ao adicionar transação');
    }
  };

  if (!auth.currentUser) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <Alert>
            <AlertDescription>Por favor, faça login para acessar o sistema financeiro.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <Alert>
            <AlertDescription>Carregando dados financeiros...</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Gestão Financeira</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Period and Filter Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Mês</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Ano</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Filtrar por</label>
              <Select value={transactionFilter} onValueChange={setTransactionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Transações</SelectItem>
                  <SelectItem value="income">Apenas Receitas</SelectItem>
                  <SelectItem value="expense">Apenas Despesas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Button
              onClick={() => handleOpenModal('income')}
              className="bg-green-600 hover:bg-green-700"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Adicionar Receita
            </Button>
            <Button
              onClick={() => handleOpenModal('expense')}
              className="bg-red-600 hover:bg-red-700"
            >
              <MinusCircle className="w-4 h-4 mr-2" />
              Adicionar Despesa
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">Total Recebido</p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {totalIncome.toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">Total Despesas</p>
                  <p className="text-2xl font-bold text-red-600">
                    R$ {totalExpenses.toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">Saldo</p>
                  <p className={`text-2xl font-bold ${(totalIncome - totalExpenses) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {(totalIncome - totalExpenses).toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtered Transactions List */}
          <div className="space-y-4">
            <h3 className="font-medium">
              {transactionFilter === 'all' 
                ? 'Todas as Transações' 
                : transactionFilter === 'income' 
                  ? 'Receitas' 
                  : 'Despesas'}
            </h3>
            {filteredTransactions.length > 0 ? (
              <div className="space-y-2">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      {transaction.type === 'income' ? (
                        <PlusCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <MinusCircle className="w-4 h-4 text-red-600" />
                      )}
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-gray-500">
                          {transaction.date.toDate().toLocaleDateString()} - {
                            getCategoryLabel(transaction.type, transaction.category)
                          }
                        </p>
                      </div></div>
                    <span
                      className={`font-medium ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      R$ {transaction.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500">Nenhuma transação encontrada</p>
            )}
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Transaction Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {transactionType === 'income' ? 'Adicionar Receita' : 'Adicionar Despesa'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor</label>
              <Input
                type="number"
                placeholder="0.00"
                value={transactionDetails.amount}
                onChange={(e) => setTransactionDetails({
                  ...transactionDetails,
                  amount: e.target.value
                })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Input
                type="text"
                placeholder="Digite uma descrição"
                value={transactionDetails.description}
                onChange={(e) => setTransactionDetails({
                  ...transactionDetails,
                  description: e.target.value
                })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Select
                value={transactionDetails.category}
                onValueChange={(value) => setTransactionDetails({
                  ...transactionDetails,
                  category: value
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {TRANSACTION_CATEGORIES[transactionType]?.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data</label>
              <Input
                type="date"
                value={transactionDetails.date}
                onChange={(e) => setTransactionDetails({
                  ...transactionDetails,
                  date: e.target.value
                })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddTransaction}
              className={transactionType === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinancialDashboard;