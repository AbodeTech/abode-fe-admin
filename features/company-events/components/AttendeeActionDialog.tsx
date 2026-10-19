'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useChangeAttendeePickup, useRegisterAttendeeOnBehalf } from '../hooks/use-attendee-actions';
import type { PickupLocation, RegistrationCategory } from '../schemas/company-event.schema';

export function AttendeeActionDialog({
  open,
  onOpenChange,
  eventId,
  registrationId,
  name,
  email,
  phone,
  pickupLocations,
  mode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  registrationId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  pickupLocations: PickupLocation[];
  mode: 'register' | 'pickup';
}) {
  const [pickupId, setPickupId] = useState('');
  const [category, setCategory] = useState<RegistrationCategory | 'account'>('account');
  const [attendeeName, setAttendeeName] = useState(name);
  const [attendeeEmail, setAttendeeEmail] = useState(email ?? '');
  const [attendeePhone, setAttendeePhone] = useState(phone ?? '');
  const [notify, setNotify] = useState(true);
  const register = useRegisterAttendeeOnBehalf();
  const changePickup = useChangeAttendeePickup();

  const submit = () => {
    if (pickupLocations.length && !pickupId) {
      toast.error('Choose a pickup location');
      return;
    }
    if (mode === 'register') {
      if (!attendeeName.trim() || !attendeeEmail.trim()) {
        toast.error('Name and email are required to send the pass');
        return;
      }
      register.mutate({
        eventId,
        registrationId,
        ...(pickupId ? { pickup_location_id: pickupId } : {}),
        ...(category !== 'account' ? { category } : {}),
        name: attendeeName.trim(),
        email: attendeeEmail.trim(),
        ...(attendeePhone.trim() ? { phone: attendeePhone.trim() } : {}),
      }, {
        onSuccess: (result) => {
          toast.success(result.pass_sent ? 'Attendee registered; pass queued' : 'Attendee registered; pass could not be sent');
          onOpenChange(false);
        },
        onError: (error) => toast.error(error.message),
      });
    } else {
      changePickup.mutate({ eventId, registrationId, pickup_location_id: pickupId, notify }, {
        onSuccess: (result) => {
          toast.success(result.pass_sent ? 'Pickup changed; fresh pass queued' : 'Pickup changed');
          onOpenChange(false);
        },
        onError: (error) => toast.error(error.message),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'register' ? 'Register on behalf' : 'Change pickup'}</DialogTitle>
          <DialogDescription>{mode === 'register' ? 'Record a phone confirmation and send the attendee their pass.' : 'Move this attendee to another pickup point.'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {mode === 'register' && <>
            <div className="space-y-1"><Label htmlFor="attendee-name">Name</Label><Input id="attendee-name" value={attendeeName} onChange={(event) => setAttendeeName(event.target.value)} /></div>
            <div className="space-y-1"><Label htmlFor="attendee-email">Email</Label><Input id="attendee-email" type="email" value={attendeeEmail} onChange={(event) => setAttendeeEmail(event.target.value)} /></div>
            <div className="space-y-1"><Label htmlFor="attendee-phone">Phone</Label><Input id="attendee-phone" value={attendeePhone} onChange={(event) => setAttendeePhone(event.target.value)} /></div>
            <div className="space-y-1"><Label>Category</Label><Select value={category} onValueChange={(value) => setCategory(value as RegistrationCategory | 'account')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="account">Use account category</SelectItem><SelectItem value="client">Client</SelectItem><SelectItem value="associate">Associate</SelectItem><SelectItem value="associate_pro">Associate Pro</SelectItem></SelectContent></Select></div>
          </>}
          {pickupLocations.length > 0 && <div className="space-y-1"><Label>Pickup location</Label><Select value={pickupId} onValueChange={setPickupId}><SelectTrigger><SelectValue placeholder="Choose a pickup" /></SelectTrigger><SelectContent>{pickupLocations.map((pickup) => <SelectItem key={pickup.id} value={pickup.id}>{pickup.name}</SelectItem>)}</SelectContent></Select></div>}
          {mode === 'pickup' && <label className="flex items-center gap-2 text-sm"><Checkbox checked={notify} onCheckedChange={(checked) => setNotify(checked === true)} /> Email an updated pass</label>}
        </div>
        <DialogFooter><Button onClick={submit} disabled={register.isPending || changePickup.isPending}>{mode === 'register' ? 'Register and send pass' : 'Save pickup'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
