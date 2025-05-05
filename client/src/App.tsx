import React from "react";
import { Route, Switch, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SimpleLogin from "@/pages/SimpleLogin";
import Register from "@/pages/Register";
import Exam from "@/pages/Exam";
import Certificates from "@/pages/Certificates";
import SimpleDashboard from "@/pages/SimpleDashboard";
import NotFound from "@/pages/not-found";

function App() {
  const [location, setLocation] = useLocation();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8 flex-grow">
        <Switch>
          <Route path="/" component={SimpleLogin} />
          <Route path="/register" component={Register} />
          <Route path="/auth" component={SimpleLogin} />
          <Route path="/dashboard" component={SimpleDashboard} />
          <Route path="/exam" component={Exam} />
          <Route path="/certificates" component={Certificates} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}

export default App;