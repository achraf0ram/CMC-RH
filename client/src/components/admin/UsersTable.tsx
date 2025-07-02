import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { fr } from 'date-fns/locale';

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
  is_admin: boolean;
  profile_photo_url: string;
  last_seen?: string;
}

interface UsersTableProps {
  users: User[];
}

export const UsersTable: React.FC<UsersTableProps> = ({ users }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Joined On</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map(user => (
          <TableRow key={user.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={user.profile_photo_url} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                {user.name}
              </div>
            </TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.phone || '-'}</TableCell>
            <TableCell>
              <Badge variant={user.is_admin ? 'destructive' : 'secondary'}>
                {user.is_admin ? 'Admin' : 'User'}
              </Badge>
            </TableCell>
            <TableCell>{format(new Date(user.created_at), 'd MMMM yyyy', { locale: fr })}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}; 