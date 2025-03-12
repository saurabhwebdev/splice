import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, getDoc, getDocs, query, where, updateDoc, deleteDoc, DocumentData, QueryDocumentSnapshot, setDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCweMVO0mf2Jkdux2w_QY5JXRQlr-GKc6U",
  authDomain: "spliced-23ab4.firebaseapp.com",
  projectId: "spliced-23ab4",
  storageBucket: "spliced-23ab4.firebasestorage.app",
  messagingSenderId: "926410697898",
  appId: "1:926410697898:web:b49dfb178bf1fae0e4b4d3",
  measurementId: "G-TP7C048XQ2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics conditionally (only in browser)
let analytics = null;
if (typeof window !== 'undefined') {
  // Check if analytics is supported before initializing
  isSupported().then((supported: boolean) => supported && (analytics = getAnalytics(app)));
}

// Initialize Firestore
export const db = getFirestore(app);

// Group Types
export interface Group {
  id: string;
  name: string;
  currency: string;
  headerImage: string;
  headerImageAttribution: string;
  totalExpenditure: number;
  participants: Participant[];
  createdAt: Date;
  accessCode: string;
  expenses: Expense[];
  colorIndex?: number;
}

export interface Participant {
  firstName: string;
  lastName: string;
  // Add more fields as needed
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  paidBy: string; // participant's name who paid
  splitType: 'equal' | 'custom';
  splits: {
    participantName: string;
    amount: number;
  }[];
  createdAt: string;
}

// Group Functions
export const createGroup = async (groupData: Omit<Group, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'groups'), {
      ...groupData,
      createdAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
};

export const getGroup = async (groupId: string): Promise<Group | null> => {
  try {
    const docRef = doc(db, 'groups', groupId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt.toDate(),
      } as Group;
    }
    return null;
  } catch (error) {
    console.error('Error fetching group:', error);
    throw error;
  }
};

export const getAllGroups = async (): Promise<Group[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'groups'));
    return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
    })) as Group[];
  } catch (error) {
    console.error('Error fetching groups:', error);
    throw error;
  }
};

export const updateGroup = async (groupId: string, updates: Partial<Group>) => {
  try {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, updates);
  } catch (error) {
    console.error('Error updating group:', error);
    throw error;
  }
};

export const deleteGroup = async (groupId: string) => {
  try {
    const docRef = doc(db, 'groups', groupId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting group:', error);
    throw error;
  }
};

export const addExpense = async (groupId: string, expense: Omit<Expense, 'id' | 'groupId' | 'createdAt'>) => {
  try {
    const expenseRef = doc(collection(db, 'expenses'));
    const newExpense: Expense = {
      id: expenseRef.id,
      groupId,
      ...expense,
      createdAt: new Date().toISOString()
    };

    await setDoc(expenseRef, newExpense);

    // Check if this is a settlement expense
    const isSettlement = expense.description.toLowerCase().includes('settlement');

    // Update group's total expenditure only if it's not a settlement
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      totalExpenditure: isSettlement ? increment(0) : increment(expense.amount),
      expenses: arrayUnion(newExpense)
    });

    return newExpense;
  } catch (error) {
    console.error('Error adding expense:', error);
    throw error;
  }
};

export const deleteExpense = async (groupId: string, expense: Expense) => {
  try {
    const expenseRef = doc(db, 'expenses', expense.id);
    await deleteDoc(expenseRef);

    // Check if this is a settlement expense
    const isSettlement = expense.description.toLowerCase().includes('settlement');

    // Update group's total expenditure only if it's not a settlement
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      totalExpenditure: isSettlement ? increment(0) : increment(-expense.amount),
      expenses: arrayRemove(expense)
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};

export const updateExpense = async (groupId: string, expenseId: string, expense: Omit<Expense, 'id' | 'groupId' | 'createdAt'>) => {
  try {
    const expenseRef = doc(db, 'expenses', expenseId);
    const oldExpenseDoc = await getDoc(expenseRef);
    
    if (!oldExpenseDoc.exists()) {
      throw new Error('Expense not found');
    }

    const oldExpense = oldExpenseDoc.data() as Expense;
    const updatedExpense: Expense = {
      id: expenseId,
      groupId,
      ...expense,
      createdAt: oldExpense.createdAt
    };

    await setDoc(expenseRef, updatedExpense);

    // Check if these are settlement expenses
    const wasSettlement = oldExpense.description.toLowerCase().includes('settlement');
    const isSettlement = expense.description.toLowerCase().includes('settlement');

    // Calculate the change to total expenditure based on settlement status
    let expenditureChange = 0;
    if (!wasSettlement && !isSettlement) {
      // Neither was a settlement, so calculate the difference
      expenditureChange = expense.amount - oldExpense.amount;
    } else if (!wasSettlement && isSettlement) {
      // Changed from regular expense to settlement, remove the old amount
      expenditureChange = -oldExpense.amount;
    } else if (wasSettlement && !isSettlement) {
      // Changed from settlement to regular expense, add the new amount
      expenditureChange = expense.amount;
    }
    // If both were settlements, no change to total expenditure

    // Update group's total expenditure
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      totalExpenditure: increment(expenditureChange),
      expenses: arrayUnion(updatedExpense)
    });

    // Remove old expense from the array
    await updateDoc(groupRef, {
      expenses: arrayRemove(oldExpense)
    });

    return updatedExpense;
  } catch (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
};

export const getGroupByAccessCode = async (accessCode: string) => {
  try {
    // Normalize the access code by trimming and converting to uppercase
    const normalizedAccessCode = accessCode.trim().toUpperCase();
    
    const q = query(collection(db, 'groups'), where('accessCode', '==', normalizedAccessCode));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('No group found with access code:', normalizedAccessCode);
      return null;
    }

    const groupDoc = querySnapshot.docs[0];
    const groupData = groupDoc.data();
    
    // Ensure the group data is valid
    if (!groupData) {
      console.error('Group document exists but has no data');
      return null;
    }

    return {
      id: groupDoc.id,
      ...groupData,
      createdAt: groupData.createdAt?.toDate() || new Date(),
    } as Group;
  } catch (error) {
    console.error('Error getting group by access code:', error);
    throw error;
  }
};

// Function to recalculate total expenditure excluding settlements
export const recalculateGroupExpenditure = async (groupId: string, expenses: Expense[]) => {
  try {
    // Filter out settlement expenses
    const nonSettlementExpenses = expenses.filter(
      expense => !expense.description.toLowerCase().includes('settlement')
    );
    
    // Calculate the correct total
    const correctTotal = nonSettlementExpenses.reduce(
      (total, expense) => total + expense.amount, 
      0
    );
    
    // Update the group with the correct total
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      totalExpenditure: correctTotal
    });
    
    return correctTotal;
  } catch (error) {
    console.error('Error recalculating group expenditure:', error);
    throw error;
  }
};

export { analytics };
export default db; 