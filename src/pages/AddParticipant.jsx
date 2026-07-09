import React, { useState, useEffect } from 'react';
import { db } from '@/api/client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, User, Heart, MapPin, Phone, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AddParticipant() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [staff, setStaff] = useState([]);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    ethnicity: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    county: '',
    recovery_start_date: '',
    primary_substance: '',
    secondary_substance: '',
    enrollment_date: new Date().toISOString().split('T')[0],
    status: 'Active',
    assigned_coach_id: '',
    assigned_coach_name: '',
    referral_source: '',
    housing_status: '',
    employment_status: '',
    education_level: '',
    insurance_status: '',
    veteran_status: false,
    has_children: false,
    notes: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });

  useEffect(() => {
    db.entities.User.list().then(setStaff);
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCoachSelect = (userId) => {
    const selectedStaff = staff.find(s => s.id === userId);
    setFormData(prev => ({
      ...prev,
      assigned_coach_id: userId,
      assigned_coach_name: selectedStaff?.full_name || ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await db.entities.Participant.create(formData);
    navigate(createPageUrl('Participants'));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('Participants')}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add New Participant</h1>
          <p className="text-slate-500">Enter participant information to enroll in the program</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-[#5B9A9A]" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleChange('date_of_birth', e.target.value)}
              />
            </div>
            <div>
              <Label>Gender</Label>
              <Select value={formData.gender} onValueChange={(v) => handleChange('gender', v)}>
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Non-binary">Non-binary</SelectItem>
                  <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ethnicity</Label>
              <Select value={formData.ethnicity} onValueChange={(v) => handleChange('ethnicity', v)}>
                <SelectTrigger><SelectValue placeholder="Select ethnicity" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="White">White</SelectItem>
                  <SelectItem value="Black or African American">Black or African American</SelectItem>
                  <SelectItem value="Hispanic or Latino">Hispanic or Latino</SelectItem>
                  <SelectItem value="Asian">Asian</SelectItem>
                  <SelectItem value="Native American or Alaska Native">Native American or Alaska Native</SelectItem>
                  <SelectItem value="Native Hawaiian or Pacific Islander">Native Hawaiian or Pacific Islander</SelectItem>
                  <SelectItem value="Two or More Races">Two or More Races</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                  <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.veteran_status}
                  onCheckedChange={(v) => handleChange('veteran_status', v)}
                />
                <Label>Veteran</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.has_children}
                  onCheckedChange={(v) => handleChange('has_children', v)}
                />
                <Label>Has Children</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5 text-[#5B9A9A]" />
              Address
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="zip">ZIP Code</Label>
              <Input
                id="zip"
                value={formData.zip_code}
                onChange={(e) => handleChange('zip_code', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="county">County</Label>
              <Input
                id="county"
                value={formData.county}
                onChange={(e) => handleChange('county', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Recovery Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Heart className="w-5 h-5 text-[#5B9A9A]" />
              Recovery Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="recovery_start">Recovery Start Date</Label>
              <Input
                id="recovery_start"
                type="date"
                value={formData.recovery_start_date}
                onChange={(e) => handleChange('recovery_start_date', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="enrollment">Enrollment Date *</Label>
              <Input
                id="enrollment"
                type="date"
                value={formData.enrollment_date}
                onChange={(e) => handleChange('enrollment_date', e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Primary Substance</Label>
              <Select value={formData.primary_substance} onValueChange={(v) => handleChange('primary_substance', v)}>
                <SelectTrigger><SelectValue placeholder="Select substance" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alcohol">Alcohol</SelectItem>
                  <SelectItem value="Opioids">Opioids</SelectItem>
                  <SelectItem value="Methamphetamine">Methamphetamine</SelectItem>
                  <SelectItem value="Cocaine">Cocaine</SelectItem>
                  <SelectItem value="Cannabis">Cannabis</SelectItem>
                  <SelectItem value="Benzodiazepines">Benzodiazepines</SelectItem>
                  <SelectItem value="Multiple Substances">Multiple Substances</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                  <SelectItem value="None - Mental Health Only">None - Mental Health Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="secondary">Secondary Substance</Label>
              <Input
                id="secondary"
                value={formData.secondary_substance}
                onChange={(e) => handleChange('secondary_substance', e.target.value)}
                placeholder="If applicable"
              />
            </div>
            <div>
              <Label>Referral Source</Label>
              <Select value={formData.referral_source} onValueChange={(v) => handleChange('referral_source', v)}>
                <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Self">Self</SelectItem>
                  <SelectItem value="Family/Friend">Family/Friend</SelectItem>
                  <SelectItem value="Healthcare Provider">Healthcare Provider</SelectItem>
                  <SelectItem value="Treatment Center">Treatment Center</SelectItem>
                  <SelectItem value="Criminal Justice">Criminal Justice</SelectItem>
                  <SelectItem value="Social Services">Social Services</SelectItem>
                  <SelectItem value="Community Organization">Community Organization</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Assigned Coach</Label>
              <Select value={formData.assigned_coach_id} onValueChange={handleCoachSelect}>
                <SelectTrigger><SelectValue placeholder="Select coach" /></SelectTrigger>
                <SelectContent>
                  {staff.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Social Determinants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-[#5B9A9A]" />
              Social Determinants
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Housing Status</Label>
              <Select value={formData.housing_status} onValueChange={(v) => handleChange('housing_status', v)}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Stable Housing">Stable Housing</SelectItem>
                  <SelectItem value="Transitional Housing">Transitional Housing</SelectItem>
                  <SelectItem value="Homeless">Homeless</SelectItem>
                  <SelectItem value="Living with Family">Living with Family</SelectItem>
                  <SelectItem value="Sober Living">Sober Living</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Employment Status</Label>
              <Select value={formData.employment_status} onValueChange={(v) => handleChange('employment_status', v)}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Employed Full-time">Employed Full-time</SelectItem>
                  <SelectItem value="Employed Part-time">Employed Part-time</SelectItem>
                  <SelectItem value="Unemployed - Seeking">Unemployed - Seeking</SelectItem>
                  <SelectItem value="Unemployed - Not Seeking">Unemployed - Not Seeking</SelectItem>
                  <SelectItem value="Student">Student</SelectItem>
                  <SelectItem value="Disabled">Disabled</SelectItem>
                  <SelectItem value="Retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Education Level</Label>
              <Select value={formData.education_level} onValueChange={(v) => handleChange('education_level', v)}>
                <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Less than High School">Less than High School</SelectItem>
                  <SelectItem value="High School/GED">High School/GED</SelectItem>
                  <SelectItem value="Some College">Some College</SelectItem>
                  <SelectItem value="Associate's Degree">Associate's Degree</SelectItem>
                  <SelectItem value="Bachelor's Degree">Bachelor's Degree</SelectItem>
                  <SelectItem value="Graduate Degree">Graduate Degree</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Insurance Status</Label>
              <Select value={formData.insurance_status} onValueChange={(v) => handleChange('insurance_status', v)}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Medicaid">Medicaid</SelectItem>
                  <SelectItem value="Medicare">Medicare</SelectItem>
                  <SelectItem value="Private Insurance">Private Insurance</SelectItem>
                  <SelectItem value="Uninsured">Uninsured</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Phone className="w-5 h-5 text-[#5B9A9A]" />
              Emergency Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="emergency_name">Contact Name</Label>
              <Input
                id="emergency_name"
                value={formData.emergency_contact_name}
                onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="emergency_phone">Contact Phone</Label>
              <Input
                id="emergency_phone"
                value={formData.emergency_contact_phone}
                onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={4}
                placeholder="Additional notes about the participant..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link to={createPageUrl('Participants')}>
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving} className="bg-[#5B9A9A] hover:bg-[#3D7A7A]">
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Participant
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}