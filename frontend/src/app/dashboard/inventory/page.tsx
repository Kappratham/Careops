"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import api from "@/lib/api";
import { InventoryItem } from "@/types";
import { toast } from "sonner";
import { Package, Loader2, Plus, AlertTriangle, Edit, Trash2 } from "lucide-react";

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", unit: "pieces", current_quantity: 0, low_threshold: 5 });
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [editQty, setEditQty] = useState(0);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await api.get("/inventory");
      setItems(res.data.items);
    } catch {
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  const addItem = async () => {
    if (!newItem.name.trim()) { toast.error("Name is required"); return; }
    try {
      await api.post("/inventory", newItem);
      toast.success("Item added!");
      setShowAdd(false);
      setNewItem({ name: "", unit: "pieces", current_quantity: 0, low_threshold: 5 });
      fetchItems();
    } catch {
      toast.error("Failed to add item");
    }
  };

  const updateQuantity = async () => {
    if (!editItem) return;
    try {
      await api.put(`/inventory/${editItem.id}`, { current_quantity: editQty });
      toast.success("Quantity updated!");
      setEditItem(null);
      fetchItems();
    } catch {
      toast.error("Failed to update");
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await api.delete(`/inventory/${id}`);
      toast.success("Item deleted!");
      fetchItems();
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-description">Track resources and supplies</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-white"><Plus className="w-4 h-4 mr-2" /> Add Item</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Inventory Item</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Item Name</Label>
                <Input placeholder="Gloves" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input placeholder="pieces" value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input type="number" value={newItem.current_quantity} onChange={(e) => setNewItem({ ...newItem, current_quantity: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label>Low Alert</Label>
                  <Input type="number" value={newItem.low_threshold} onChange={(e) => setNewItem({ ...newItem, low_threshold: parseInt(e.target.value) || 5 })} />
                </div>
              </div>
              <Button onClick={addItem} className="w-full gradient-primary text-white">Add Item</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <Package className="w-12 h-12 text-muted-foreground mb-3" />
          <h3 className="font-medium mb-1">No inventory items</h3>
          <p className="text-sm text-muted-foreground">Add items to track your resources and supplies.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const percentage = item.low_threshold > 0 ? Math.min((item.current_quantity / (item.low_threshold * 3)) * 100, 100) : 100;
            return (
              <Card key={item.id} className={`animate-fade-in hover:shadow-md transition-shadow ${item.is_critical ? "border-red-300 bg-red-50/50" : item.is_low_stock ? "border-yellow-300 bg-yellow-50/50" : ""}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className={`w-5 h-5 ${item.is_critical ? "text-red-600" : item.is_low_stock ? "text-yellow-600" : "text-muted-foreground"}`} />
                      <h3 className="font-medium">{item.name}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      {item.is_critical && <Badge className="severity-critical">Out of Stock</Badge>}
                      {item.is_low_stock && !item.is_critical && <Badge className="severity-warning">Low Stock</Badge>}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Stock Level</span>
                      <span className="font-medium">{item.current_quantity} {item.unit}</span>
                    </div>
                    <Progress value={percentage} className={`h-2 ${item.is_critical ? "[&>div]:bg-red-500" : item.is_low_stock ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-500"}`} />
                    <p className="text-xs text-muted-foreground mt-1">Low alert at: {item.low_threshold} {item.unit}</p>
                  </div>

                  <div className="flex gap-2">
                    <Dialog open={editItem?.id === item.id} onOpenChange={(open) => { if (!open) setEditItem(null); }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => { setEditItem(item); setEditQty(item.current_quantity); }}>
                          <Edit className="w-3 h-3 mr-1" /> Update
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Update {item.name}</DialogTitle></DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div className="space-y-2">
                            <Label>Current Quantity</Label>
                            <Input type="number" value={editQty} onChange={(e) => setEditQty(parseInt(e.target.value) || 0)} />
                          </div>
                          <Button onClick={updateQuantity} className="w-full gradient-primary text-white">Save</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="sm" className="text-red-600" onClick={() => deleteItem(item.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}