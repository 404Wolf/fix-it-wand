/** @jsxImportSource https://esm.sh/react@19.0.0 */

import { useAuth } from "../hooks/useAuth.ts";
import { Link } from "https://esm.sh/react-router-dom@7.4.1?deps=react@19.0.0,react-dom@19.0.0";
import { Wand } from "../components/Wands/Wand.tsx";
import { GenerateWorkorderForm } from "../components/WorkOrders/GenerateWorkOrderForm/GenerateWorkOrderForm.tsx";
import { WorkOrdersList } from "../components/WorkOrders/WorkOrderList.tsx";
import { client } from "../hono.ts";
import { useEffect, useState } from "https://esm.sh/react@19.0.0";
import { WorkOrder } from "../types.ts";

export function Home() {
  const { user } = useAuth();
  const [workorders, setWorkorders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWorkorders = async () => {
    setLoading(true);
    const response = await client.workorders.$get();
    const { workorders } = await response.json();
    setWorkorders(
      workorders.map((workorder) => ({
        ...workorder,
        createdAt: new Date(workorder.createdAt!),
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    if (user) loadWorkorders();
  }, [user]);

  const onNewWorkorder = () => {
    loadWorkorders();
  };

  return (
    <div className="space-y-6">
      {user && (
        <div className="bg-stone-50 rounded-md p-4 flex justify-between items-center shadow-md">
          <div>
            <span className="text-gray-900">Logged in as &nbsp;</span>
            <span className="font-medium">{user.email}</span>
          </div>
          <Link
            to="/profile"
            className="text-gray-700 hover:text-gray-900 underline"
          >
            View Profile
          </Link>
        </div>
      )}

      <div className="bg-stone-50 rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-medium tracking-tight mb-4">
          Welcome to the <span className="font-bold">Fix It Wand</span>
          control panel!
        </h2>

        <p className="text-gray-700">
          The Fix It Wand is a handheld IOT wand for Case Western students that
          you wave to submit work orders! It connects to the Asset Essentials
          work order system to let you make work orders with the wave of a wand!
          This is a final project for CSDS377, Introduction to Connected
          Devices, and is a work in progress.
        </p>
      </div>

      <div>
        <Wand />
      </div>

      {user && (
        <div className="bg-stone-50 rounded-lg shadow-sm border border-gray-200 p-6">
          <WorkOrdersList
            workorders={workorders}
            loading={loading}
            onChange={loadWorkorders}
          />
        </div>
      )}

      <GenerateWorkorderForm onNew={onNewWorkorder} />
    </div>
  );
}
