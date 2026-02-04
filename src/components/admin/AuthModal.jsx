import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';


const AuthModal = ({ isOpen, setIsOpen }) => {
  const { signIn } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const resetFormFields = () => {
    setEmail('');
    setPassword('');
    setError('');
  }

  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message);
    } else {
      toast({
        title: 'Login Successful!',
        description: 'Welcome back!',
      });
      setIsOpen(false);
    }
    setIsLoading(false);
  };

  const resetState = () => {
    resetFormFields();
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetState();
    }}>
      <DialogContent className="sm:max-w-md p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Login</DialogTitle>
          <DialogDescription>
            Log in to continue.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6">
          <form onSubmit={handleSignIn}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="login-email">Email</Label>
                <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="login-password">Password</Label>
                <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              {error && <div className="text-destructive text-sm flex items-center"><AlertCircle className="h-4 w-4 mr-2" />{error}</div>}
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Login
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
