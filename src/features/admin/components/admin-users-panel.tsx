"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, CheckCircle, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/trpc/client";

export function AdminUsersPanel() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
    email: string;
    isBlocked: boolean;
  } | null>(null);
  const [blockReason, setBlockReason] = useState("");

  const { data: users, isLoading } = useQuery(
    trpc.adminUsers.getAll.queryOptions(),
  );

  const blockMutation = useMutation(
    trpc.adminUsers.block.mutationOptions({
      onSuccess: () => {
        toast.success("User blocked");
        queryClient.invalidateQueries({
          queryKey: trpc.adminUsers.getAll.queryKey(),
        });
        setSelectedUser(null);
        setBlockReason("");
      },
      onError: (err: any) => toast.error(err.message),
    }),
  );

  const unblockMutation = useMutation(
    trpc.adminUsers.unblock.mutationOptions({
      onSuccess: () => {
        toast.success("User unblocked");
        queryClient.invalidateQueries({
          queryKey: trpc.adminUsers.getAll.queryKey(),
        });
        setSelectedUser(null);
      },
      onError: (err: any) => toast.error(err.message),
    }),
  );

  const filtered = (users ?? []).filter(
    (u: any) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const handleConfirm = () => {
    if (!selectedUser) return;
    if (selectedUser.isBlocked) {
      unblockMutation.mutate({ userId: selectedUser.id });
    } else {
      blockMutation.mutate({
        userId: selectedUser.id,
        email: selectedUser.email,
        name: selectedUser.name,
        reason: blockReason || undefined,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary" className="text-xs">
          {users?.length ?? 0} user{(users?.length ?? 0) !== 1 ? "s" : ""}
        </Badge>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No users found.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="hidden sm:table-cell">Last Sign In</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    {user.lastSignInAt
                      ? new Date(user.lastSignInAt).toLocaleDateString()
                      : "Never"}
                  </TableCell>
                  <TableCell>
                    {user.isBlocked ? (
                      <Badge
                        variant="outline"
                        className="border-destructive/50 text-destructive"
                      >
                        <Ban className="mr-1 size-3" />
                        Blocked
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-emerald-500/50 text-emerald-600"
                      >
                        <CheckCircle className="mr-1 size-3" />
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant={user.isBlocked ? "outline" : "destructive"}
                      size="sm"
                      onClick={() => {
                        setSelectedUser({
                          id: user.id,
                          name: user.name,
                          email: user.email,
                          isBlocked: user.isBlocked,
                        });
                        setBlockReason("");
                      }}
                    >
                      {user.isBlocked ? (
                        <>
                          <CheckCircle className="mr-1 size-3" />
                          Unblock
                        </>
                      ) : (
                        <>
                          <Ban className="mr-1 size-3" />
                          Block
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={!!selectedUser}
        onOpenChange={(o) => {
          if (!o) setSelectedUser(null);
        }}
      >
        {selectedUser && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedUser.isBlocked ? "Unblock User" : "Block User"}
              </DialogTitle>
              <DialogDescription>
                {selectedUser.isBlocked
                  ? `Restore access for ${selectedUser.name} (${selectedUser.email}). They will be able to log in again.`
                  : `Revoke access for ${selectedUser.name} (${selectedUser.email}). They will be blocked from logging in.`}
              </DialogDescription>
            </DialogHeader>

            {!selectedUser.isBlocked && (
              <div className="space-y-2">
                <Label htmlFor="reason">Reason (optional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Why is this user being blocked?"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setSelectedUser(null)}>
                Cancel
              </Button>
              <Button
                variant={selectedUser.isBlocked ? "default" : "destructive"}
                disabled={blockMutation.isPending || unblockMutation.isPending}
                onClick={handleConfirm}
              >
                {blockMutation.isPending || unblockMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Please wait...
                  </>
                ) : selectedUser.isBlocked ? (
                  "Unblock"
                ) : (
                  "Block User"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
