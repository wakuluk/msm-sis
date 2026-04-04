import { useEffect, useState } from "react";
import {
  AlertCircle,
  GraduationCap,
  IdCard,
  Mail,
  MapPin,
  UserRound,
} from "lucide-react";
import {
  ProfileField,
  ProfileHeaderCard,
  ProfileLoading,
  ProfilePage,
  ProfileSection,
  ProfileState,
  ProfileStatusBadge,
  ProfileSummaryItem,
  ProfileTabPanel,
} from "@/components/profile/ProfilePrimitives";
import { formatProfileValue } from "@/components/profile/formatProfileValue";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchStudentProfile } from "@/services/studentService";

function formatDate(value) {
  if (!value) {
    return "Not provided";
  }

  const parsed = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function loadProfile() {
      try {
        setIsLoading(true);
        setError("");

        const payload = await fetchStudentProfile();

        if (!isActive) {
          return;
        }

        setProfile(payload);
      } catch (loadError) {
        if (!isActive) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Failed to load student profile.");
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isActive = false;
    };
  }, []);

  if (isLoading) {
    return <ProfileLoading />;
  }

  if (error) {
    return (
      <ProfileState
        icon={AlertCircle}
        title="Unable to load your profile"
        description={error}
        tone="danger"
      />
    );
  }

  if (!profile) {
    return (
      <ProfileState
        icon={UserRound}
        title="Profile not available"
        description="A student record was not found for this account."
      />
    );
  }

  const personalIdentityFields = [
    { label: "First name", value: profile.firstName },
    { label: "Middle name", value: profile.middleName },
    { label: "Last name", value: profile.lastName },
    { label: "Name suffix", value: profile.nameSuffix },
  ];

  const personalBackgroundFields = [
    { label: "Date of birth", value: formatDate(profile.dateOfBirth) },
    { label: "Gender", value: profile.gender },
    { label: "Ethnicity", value: profile.ethnicity },
  ];

  const studentFields = [
    { label: "Student ID", value: profile.studentId },
    { label: "Class standing", value: profile.classStanding },
    { label: "Class of", value: profile.classOf },
    { label: "Estimated graduation", value: formatDate(profile.estimatedGradDate) },
  ];

  const contactFields = [
    { label: "Email address", value: profile.email },
    { label: "Phone number", value: profile.phone },
  ];

  const addressFields = [
    { label: "Address line 1", value: profile.addressLine1 },
    { label: "Address line 2", value: profile.addressLine2 },
    { label: "City", value: profile.city },
    { label: "State / region", value: profile.stateRegion },
    { label: "Postal code", value: profile.postalCode },
    { label: "Country", value: profile.countryCode },
  ];

  return (
    <ProfilePage>
      <ProfileHeaderCard
        eyebrow="Student Profile"
        title={profile.fullName}
        statusBadges={
          <>
            <ProfileStatusBadge tone="cool">
              {formatProfileValue(profile.classStanding)}
            </ProfileStatusBadge>
            <ProfileStatusBadge tone="warm">
              Class of {formatProfileValue(profile.classOf, "TBD")}
            </ProfileStatusBadge>
          </>
        }
        summary={<ProfileSummaryItem label="Preferred name" value={profile.preferredName} />}
      />

      <Card className="overflow-hidden">
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="justify-start">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="student">Student</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>

          <ProfileTabPanel value="personal">
            <div className="grid gap-6 lg:grid-cols-2">
              <ProfileSection icon={UserRound} title="Identity">
                {personalIdentityFields.map((field) => (
                  <ProfileField key={field.label} label={field.label} value={field.value} />
                ))}
              </ProfileSection>

              <ProfileSection icon={IdCard} title="Background">
                {personalBackgroundFields.map((field) => (
                  <ProfileField key={field.label} label={field.label} value={field.value} />
                ))}
              </ProfileSection>
            </div>
          </ProfileTabPanel>

          <ProfileTabPanel value="student">
            <div className="grid gap-6">
              <ProfileSection icon={GraduationCap} title="School record">
                {studentFields.map((field) => (
                  <ProfileField key={field.label} label={field.label} value={field.value} />
                ))}
              </ProfileSection>
            </div>
          </ProfileTabPanel>

          <ProfileTabPanel value="contact">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <ProfileSection icon={Mail} title="Contact details">
                {contactFields.map((field) => (
                  <ProfileField key={field.label} label={field.label} value={field.value} />
                ))}
              </ProfileSection>

              <ProfileSection icon={MapPin} title="Mailing address">
                {addressFields.map((field) => (
                  <ProfileField key={field.label} label={field.label} value={field.value} />
                ))}
              </ProfileSection>
            </div>
          </ProfileTabPanel>
        </Tabs>
      </Card>
    </ProfilePage>
  );
}

export default StudentProfile;
