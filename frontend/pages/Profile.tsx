/** @jsxImportSource https://esm.sh/react@19.0.0 */
import { useEffect, useState } from "https://esm.sh/react@19.0.0";
import { useAuth } from "../hooks/useAuth.ts";

const ProfileField = (
  { label, value }: { label: string; value: React.ReactNode },
) => (
  <div className="flex border-b border-gray-200 pb-2">
    <span className="font-medium text-gray-600 w-32">{label}:</span>
    <span className="text-gray-800">{value}</span>
  </div>
);

const FormField = ({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
}) => (
  <div>
    <label className="block text-gray-700 mb-1" htmlFor={id}>
      {label}
    </label>
    <input
      type="text"
      id={id}
      value={value}
      onChange={onChange}
      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
      disabled={disabled}
    />
  </div>
);

export function Profile() {
  const { user, isLoading, error, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [updateStatus, setUpdateStatus] = useState<
    { message: string; type: "success" | "error" } | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when user data is loaded
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
    }
  }, [user]);

  if (isLoading) {
    return <div className="text-center py-4">Loading profile...</div>;
  }
  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-md">{error}</div>
    );
  }
  if (!user) {
    return (
      <div className="text-gray-500 text-center py-4">
        No profile data available
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUpdateStatus(null);

    try {
      const result = await updateProfile({ firstName, lastName });

      if (result.success) {
        setUpdateStatus({
          message: "Profile updated successfully!",
          type: "success",
        });
        setIsEditing(false);
      } else {
        setUpdateStatus({
          message: result.message || "Failed to update profile",
          type: "error",
        });
      }
    } catch (err) {
      setUpdateStatus({
        message: err instanceof Error ? err.message : "An error occurred",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="text-gray-500 text-center py-4">
        No profile data available
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium tracking-tight">Your Profile</h2>
        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-amber-900 hover:text-amber-800"
          >
            Edit
          </button>
        )}
      </div>

      {updateStatus && (
        <div
          className={`mb-4 p-3 rounded-md ${
            updateStatus.type === "success"
              ? "bg-green-100 text-green-700 border border-green-300"
              : "bg-red-100 text-red-700 border border-red-300"
          }`}
        >
          {updateStatus.message}
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center mb-6">
          <div className="w-16 h-16 bg-stone-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mr-4">
            {(user.firstName?.[0] || user.email[0])
              .toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-medium">
              {`${user.firstName} ${user.lastName || ""}`.trim()}
            </h3>
            <p className="text-gray-600 text-sm">
              {user.email}
            </p>
          </div>
        </div>
      </div>

      {isEditing
        ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              id="firstName"
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={isSubmitting}
            />

            <FormField
              id="lastName"
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={isSubmitting}
            />

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 bg-amber-700 text-white rounded hover:bg-amber-800 ${
                  isSubmitting ? "opacity-75 cursor-not-allowed" : ""
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )
        : (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-800 mb-3">
                Account Info
              </h3>
              <div className="space-y-3">
                <ProfileField label="Email" value={user.email} />

                {user.id && <ProfileField label="Account ID" value={user.id} />}

                {user.createdAt &&
                  (
                    <ProfileField
                      label="Joined"
                      value={new Date(user.createdAt).toLocaleDateString()}
                    />
                  )}

                {user.emailVerified !== undefined && (
                  <div className="flex">
                    <span className="font-medium text-gray-600 w-32">
                      Status:
                    </span>
                    <span className="flex items-center">
                      <span
                        className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          user.emailVerified ? "bg-green-500" : "bg-yellow-500"
                        }`}
                      />
                      <span className="text-gray-800">
                        {user.emailVerified
                          ? "Verified"
                          : "Pending Verification"}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-800 mb-3">
                Personal Info
              </h3>
              <div className="space-y-3">
                <ProfileField
                  label="First Name"
                  value={user.firstName || "-"}
                />
                <ProfileField
                  label="Last Name"
                  value={user.lastName || "-"}
                />
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
