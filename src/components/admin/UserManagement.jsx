import React, { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient.js';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const UserManagement = ({ currentUserProfile }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('user');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (currentUserProfile.role !== 'superuser' && role === 'superuser') {
        toast({
            title: 'Permission Denied',
        description: 'Only superusers can create other superusers.',
            variant: 'destructive',
        });
        setIsLoading(false);
        return;
    }

    // We cannot call a pg_net function from a security-definer function.
    // So we're creating the user here and the trigger `handle_new_user` will assign the role.
    const { data: { user }, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role // Pass role in metadata
        }
      }
    });

    if (error) {
      toast({
        title: 'Error Creating User',
        description: error.message,
        variant: 'destructive',
      });
    } else {
        // Manually update role in profiles table, as the trigger only handles new users.
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ role: role })
            .eq('id', user.id);

        if (profileError) {
             toast({
                title: 'Error assigning role',
                description: profileError.message,
                variant: 'destructive',
            });
        } else {
            toast({
                title: 'User Created Successfully',
                description: `User ${email} has been created with the role ${role}.`,
            });
            setEmail('');
            setPassword('');
            setFullName('');
            setRole('user');
        }
    }
    setIsLoading(false);
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
                    {currentUserProfile.role === 'superuser' && (
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
