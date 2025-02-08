import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface MissingInfoAlertProps {
  firstName: string;
  lastName: string;
  hasWebsite: boolean;
  hasContact: boolean;
  missingContactInfo: boolean;
}

const MissingInfoAlert: React.FC<MissingInfoAlertProps> = ({
  firstName,
  lastName,
  hasWebsite,
  hasContact,
  missingContactInfo,
}) => {
  if (!missingContactInfo || (hasWebsite && hasContact)) {
    return null;
  }

  const getMissingInfoMessage = () => {
    if (!hasWebsite && !hasContact) {
      return "Official Website and Contact information";
    }
    if (!hasWebsite) {
      return "Official Website";
    }
    return "Official Contact information";
  };

  const getSearchQuery = () => {
    const baseQuery = `${firstName} ${lastName} congress`;
    const suffix =
      !hasWebsite && !hasContact
        ? "website contact information"
        : !hasWebsite
        ? "website"
        : "contact information";
    return encodeURIComponent(`${baseQuery} ${suffix}`);
  };

  return (
    <Alert className="mt-3 border-border bg-transparent">
      <AlertCircle className="h-4 w-4 text-muted-foreground" />
      <div className="flex flex-col space-y-1">
        <AlertDescription className="text-muted-foreground">
          We had trouble finding {firstName} {lastName}'s{" "}
          {getMissingInfoMessage()}.{" "}
          <a
            href={`https://www.google.com/search?q=${getSearchQuery()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline hover:opacity-80"
          >
            Search on Google
          </a>
        </AlertDescription>
      </div>
    </Alert>
  );
};

export default MissingInfoAlert;
