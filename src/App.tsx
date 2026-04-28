import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Farms from "./pages/Farms";
import Crops from "./pages/Crops";
import Livestock from "./pages/Livestock";
import LivestockSheds from "./pages/LivestockSheds";
import LivestockInventory from "./pages/LivestockInventory";
import Inventory from "./pages/Inventory";
import Schedule from "./pages/Schedule";
import Workers from "./pages/Workers";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Finances from "./pages/Finances";
import FieldMap from "./pages/FieldMap";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/farms"
                element={
                  <ProtectedRoute>
                    <Farms />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/crops"
                element={
                  <ProtectedRoute>
                    <Crops />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/livestock"
                element={
                  <ProtectedRoute>
                    <Livestock />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/livestock-sheds"
                element={
                  <ProtectedRoute>
                    <LivestockSheds />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/livestock-inventory"
                element={
                  <ProtectedRoute>
                    <LivestockInventory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inventory"
                element={
                  <ProtectedRoute>
                    <Inventory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/schedule"
                element={
                  <ProtectedRoute>
                    <Schedule />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/workers"
                element={
                  <ProtectedRoute>
                    <Workers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finances"
                element={
                  <ProtectedRoute>
                    <Finances />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/field-map"
                element={
                  <ProtectedRoute>
                    <FieldMap />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
