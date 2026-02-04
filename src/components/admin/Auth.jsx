import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Optional full-page auth card.
// Your app currently uses AuthModal; keep this for future routes/admin pages.
const Auth = ({ mode: _mode = 'login', onSuccess }) => {
  const { signIn } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      toast({ title: 'Login successful', description: 'Welcome back!' });

      onSuccess?.();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Authentication failed', description: error?.message || 'Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Log in</CardTitle>
        <CardDescription>Log in to continue.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Login
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default Auth;
