import React, { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const UserManagement = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('user');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (user?.role !== 'admin' && user?.role !== 'superuser') {
        toast({
          title: 'Permission Denied',
          description: 'Only admins can create users.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/create-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          role,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create user');
      }

      toast({
        title: 'User Created Successfully',
        description: `User ${email} has been created with the role ${role}.`,
      });

      setEmail('');
      setPassword('');
      setFullName('');
      setRole('user');
    } catch (error) {
      toast({
        title: 'Error Creating User',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>Create new users and assign roles.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select onValueChange={setRole} value={role}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  {user?.role === 'superuser' && (
                    <SelectItem value="superuser">Superuser</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create User
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
