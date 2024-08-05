'use client'

import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  useTheme,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { Add, Edit, Delete, Search, Restaurant } from '@mui/icons-material';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase'; // Adjust the path as needed
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

const genAI = new GoogleGenerativeAI('AIzaSyCbYe-M5c_qOmiTr4K9UlqJe4o004F3EUE');
const auth = getAuth();

const KitchenPantryApp = () => {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pantryItems, setPantryItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', quantity: '', unit: '', category: '' });
  const [editItem, setEditItem] = useState(null);
  const [suggestedRecipes, setSuggestedRecipes] = useState([]);
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const fetchPantryItems = async (currentUser) => {
      if (currentUser) {
        const itemsCollection = collection(db, 'pantryItems');
        const itemSnapshot = await getDocs(itemsCollection);
        const itemList = itemSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(item => item.userId === currentUser.uid);

        setPantryItems(itemList);
      } else {
        setPantryItems([]);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      fetchPantryItems(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setNewItem({ name: '', quantity: '', unit: '', category: '' });
  };

  const handleEditOpen = (item) => {
    setEditItem(item);
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setEditItem(null);
  };

  const handleInputChange = (e, itemType) => {
    const { id, value } = e.target;
    if (itemType === 'new') {
      setNewItem({ ...newItem, [id]: value });
    } else if (itemType === 'edit') {
      setEditItem({ ...editItem, [id]: value });
    }
  };

  const handleAddItem = async () => {
    try {
      const itemWithUserId = { ...newItem, userId: user.uid };
      const docRef = await addDoc(collection(db, 'pantryItems'), itemWithUserId);
      setPantryItems([...pantryItems, { id: docRef.id, ...itemWithUserId }]);
      handleClose();
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const handleUpdateItem = async () => {
    try {
      const itemRef = doc(db, 'pantryItems', editItem.id);
      const updatedItem = { ...editItem, userId: user.uid };
      await updateDoc(itemRef, updatedItem);
      setPantryItems(pantryItems.map(item => item.id === editItem.id ? updatedItem : item));
      handleEditClose();
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await deleteDoc(doc(db, 'pantryItems', id));
      setPantryItems(pantryItems.filter(item => item.id !== id));
    } catch (error) {
      console.error("Error removing document: ", error);
    }
  };

  const suggestRecipes = async () => {
    const itemNames = pantryItems.map(item => item.name).join(', ');
    const prompt = `Suggest 3 recipes I can make with some or all of these ingredients: ${itemNames}. For each recipe, provide a title and a brief description.`;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      text = text.replace(/\*/g, '');
      const recipes = text.split(/\d\./).filter(Boolean).map(recipe => recipe.trim());
      setSuggestedRecipes(recipes);
      setRecipeOpen(true);
    } catch (error) {
      console.error("Error suggesting recipes:", error);
    }
  };

  const filteredItems = pantryItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const handleSignUp = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setAuthOpen(false);
    } catch (error) {
      console.error("Error signing up:", error);
    }
  };

  const handleSignIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setAuthOpen(false);
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center" style={{display: "grid", placeItems:"center", marginTop:"20vh"}}>
        <Button
          variant="contained"
          onClick={() => setAuthOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Sign In / Sign Up
        </Button>

        <Dialog open={authOpen} onClose={() => setAuthOpen(false)}>
          <DialogTitle>{isSignUp ? "Sign Up" : "Sign In"}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="email"
              label="Email Address"
              type="email"
              fullWidth
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="dense"
              id="password"
              label="Password"
              type="password"
              fullWidth
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAuthOpen(false)}>Cancel</Button>
            <Button onClick={isSignUp ? handleSignUp : handleSignIn}>
              {isSignUp ? "Sign Up" : "Sign In"}
            </Button>
          </DialogActions>
          <DialogActions>
            <Button onClick={() => setIsSignUp(!isSignUp)}>
              {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AppBar position="static" className="bg-white shadow-md">
        <Toolbar>
          <Typography variant="h6" className="text-gray-800 flex-grow mr-64" style={{marginLeft:"1rem"}}>
            Kitchen Pantry
          </Typography>
          <div style={{marginRight:"2rem"}}></div>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleClickOpen}
            className="bg-blue-600 hover:bg-blue-700 mr-2"
          >
            Add Item
          </Button>
          <Button
            variant="contained"
            startIcon={<Restaurant />}
            onClick={suggestRecipes}
            className="bg-green-600 hover:bg-green-700"
            style={{marginLeft:"1rem"}}
          >
            Suggest Recipes
          </Button>
        </Toolbar>
      </AppBar>

      <main style={{margin:"2rem"}} className="container mx-auto py-8 px-4">
        <Paper className="mb-6 p-4" style={{marginBottom:"2rem"}}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search pantry items..."
            InputProps={{
              startAdornment: <Search className="text-gray-400 mr-2" />,
            }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white"
          />
        </Paper>

        <TableContainer component={Paper} className="shadow-lg">
          <Table>
            <TableHead className="bg-gray-50">
              <TableRow>
                <TableCell>Item Name</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>
                    <Chip
                      label={item.category}
                      color="primary"
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" className="text-blue-600" onClick={() => handleEditOpen(item)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" className="text-red-600" onClick={() => handleDeleteItem(item.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </main>

      {/* Add Item Dialog */}
      <Dialog
        fullScreen={fullScreen}
        open={open}
        onClose={handleClose}
        aria-labelledby="add-dialog-title"
      >
        <DialogTitle id="add-dialog-title">
          {"Add New Pantry Item"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Item Name"
            type="text"
            fullWidth
            variant="outlined"
            className="mb-4"
            value={newItem.name}
            onChange={(e) => handleInputChange(e, 'new')}
          />
          <TextField
            margin="dense"
            id="quantity"
            label="Quantity"
            type="number"
            fullWidth
            variant="outlined"
            className="mb-4"
            value={newItem.quantity}
            onChange={(e) => handleInputChange(e, 'new')}
          />
          <TextField
            margin="dense"
            id="unit"
            label="Unit"
            type="text"
            fullWidth
            variant="outlined"
            className="mb-4"
            value={newItem.unit}
            onChange={(e) => handleInputChange(e, 'new')}
          />
          <TextField
            margin="dense"
            id="category"
            label="Category"
            type="text"
            fullWidth
            variant="outlined"
            className="mb-4"
            value={newItem.category}
            onChange={(e) => handleInputChange(e, 'new')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleAddItem} color="primary" variant="contained">
            Add Item
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog
        fullScreen={fullScreen}
        open={editOpen}
        onClose={handleEditClose}
        aria-labelledby="edit-dialog-title"
      >
        <DialogTitle id="edit-dialog-title">
          {"Edit Pantry Item"}
        </DialogTitle>
        <DialogContent>
          {editItem && (
            <>
              <TextField
                autoFocus
                margin="dense"
                id="name"
                label="Item Name"
                type="text"
                fullWidth
                variant="outlined"
                className="mb-4"
                value={editItem.name}
                onChange={(e) => handleInputChange(e, 'edit')}
              />
              <TextField
                margin="dense"
                id="quantity"
                label="Quantity"
                type="number"
                fullWidth
                variant="outlined"
                className="mb-4"
                value={editItem.quantity}
                onChange={(e) => handleInputChange(e, 'edit')}
              />
              <TextField
                margin="dense"
                id="unit"
                label="Unit"
                type="text"
                fullWidth
                variant="outlined"
                className="mb-4"
                value={editItem.unit}
                onChange={(e) => handleInputChange(e, 'edit')}
              />
              <TextField
                margin="dense"
                id="category"
                label="Category"
                type="text"
                fullWidth
                variant="outlined"
                className="mb-4"
                value={editItem.category}
                onChange={(e) => handleInputChange(e, 'edit')}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleUpdateItem} color="primary" variant="contained">
            Update Item
          </Button>
        </DialogActions>
      </Dialog>

      {/* Suggested Recipes Dialog */}
      <Dialog
        fullScreen={fullScreen}
        open={recipeOpen}
        onClose={() => setRecipeOpen(false)}
        aria-labelledby="recipe-dialog-title"
      >
        <DialogTitle id="recipe-dialog-title">
          {"Suggested Recipes"}
        </DialogTitle>
        <DialogContent>
          <List>
            {suggestedRecipes.map((recipe, index) => (
              <ListItem key={index}>
                <ListItemText primary={recipe} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRecipeOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default KitchenPantryApp;