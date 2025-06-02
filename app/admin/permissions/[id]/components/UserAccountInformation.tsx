import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { fixGoogleImageUrl } from "@/lib/utils";
import { formatIsoDate } from "@/lib/utils/StringFunctions";
import { User } from "@prisma/client";

interface UserAccountInformationProps {
  user: User;
}

interface InfoBoxProps {
  label: string;
  value: string | number | boolean | null | undefined;
}

const InfoBox = ({ label, value }: InfoBoxProps) => {
  const displayValue = () => {
    if (value === null || value === undefined) return "Not set";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return value.toString();
  };

  return (
    <div className="bg-muted/50 rounded-xl p-2 px-4 border border-border/50 hover:bg-muted/70 transition-colors">
      <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
        {label}
      </Label>
      <p className="text-lg font-semibold text-foreground break-words">
        {displayValue()}
      </p>
    </div>
  );
};

const UserAccountInformation = ({ user }: UserAccountInformationProps) => {
  return (
    <div>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Avatar Section */}
        <div className="flex-shrink-0">
          <div className="text-start space-y-4">
            <Avatar className="w-[300px] h-[300px] rounded-2xl shadow-lg border-4 border-background mx-auto">
              <AvatarImage
                src={fixGoogleImageUrl(user.image)}
                alt={user.name ? `Avatar for ${user.name}` : "User avatar"}
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </Avatar>
            {user.name && (
              <div className="space-y-1">
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <p className="text-muted-foreground">
                  @{user.username || "username"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Info Grid Section */}
        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <InfoBox label="Email" value={user.email} />
            <InfoBox label="Age Range" value={user.ageRange} />
            <InfoBox
              label="Email Verified"
              value={user.emailVerified ? "Yes" : "No"}
            />
            <InfoBox label="Household Income" value={user.householdIncome} />
            <InfoBox label="Needs Onboarding" value={user.needsOnboarding} />
            <InfoBox label="Username" value={user.username} />
            <InfoBox label="Display Name" value={user.name} />
            <InfoBox
              label="Account Created"
              value={formatIsoDate(user.createdAt.toString())}
            />
            <InfoBox
              label="Last Updated"
              value={formatIsoDate(user.updatedAt?.toString())}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAccountInformation;
