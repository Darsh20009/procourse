import React from "react";
import { Route, Switch, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Login from "@/pages/Login";
import Exam from "@/pages/Exam";
import Certificates from "@/pages/Certificates";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "./lib/auth";

function App() {
  const [location, setLocation] = useLocation();

  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8 flex-grow">
          <Switch>
            <Route path="/" component={Login} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/exam" component={Exam} />
            <Route path="/certificates" component={Certificates} />
            <Route component={NotFound} />
          </Switch>
        </main>
        <Footer />
        <Toaster />
      </div>
    </AuthProvider>
  );
}

export default App;