// src/router/router.js
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";

// Import components
import Login from "../src/features/Auth/Login/Login";
import SignUpIndividual from "../src/features/Auth/SignUp/SignUpIndividual";
import SignUpInstitution from "../src/features/Auth/SignUp/SignUpInstitution";
import SelectAccountType from "../src/features/Auth/Registration/AccountType";
import OpenCurrencyAccount from "../src/features/Auth/SignUp/SelectCurrencyAccount/CurrencySelectAccount";
import PhoneVerification from "../src/features/Auth/Verification/PhoneVerification";
import PlaidCallback from "../src/features/Auth/Registration/Plaid/PlaidCallback";
import ForgotPassword from "../src/features/Auth/Password/ForgotPassword";
import Home from "../src/page/Home/Homepage";
import HomeRemit from "../src/page/Home/HomeRemit";

// Import Beneficiary Components (ONLY existing files)
import Beneficiaries from "../src/page/Beneficiary/MyBeneficiaries/Beneficiaries";
import AddBeneficiary from "../src/page/Beneficiary/AddBeneficiary/AddBeneficiary";

// Import route guards
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";

import URLDebugger from "./URLDebugger";
import Profile from "../src/page/Profile/Profile";
import TransferBalancePage from "../src/page/Transfer/TransferBalancePage";
import DepositPage from "../src/page/Deposit/DepositPage";
import BankLink from "../src/page/Deposit/components/BankLink";
import CardPayment from "../src/page/Deposit/components/Card/CardPayment";
import CardPaymentIframe from "../src/page/Deposit/components/Card/CardPaymentIframe";
import Team from "../src/page/Team/Team";
import AddTeamMember from "../src/page/Team/AddNewMember";

const ProtectedLayout = () => {
  return (
    <>
      <URLDebugger />
      <ProtectedRoute />
    </>
  );
};

const router = createBrowserRouter([
  // Public routes - only accessible when not authenticated
  {
    path: "/",
    element: <PublicRoute />,
    children: [
      {
        index: true,
        element: <Login />,
      },
      {
        path: "selectaccounttype",
        element: <SelectAccountType />,
      },
      {
        path: "signupindividual",
        element: <SignUpIndividual />,
      },
      {
        path: "signupinstitution",
        element: <SignUpInstitution />,
      },
      {
        path: "opencurrencyaccount",
        element: <OpenCurrencyAccount />,
      },
      {
        path: "phoneverification",
        element: <PhoneVerification />,
      },
      {
        path: "forgotpassword",
        element: <ForgotPassword />,
      },
      {
        path: "plaidcallback",
        element: <PlaidCallback />,
      },
    ],
  },

  // Protected routes - only accessible when authenticated
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        path: "home/:customerId",
        element: <Home />,
      },
      {
        path: "transfer/:customerId",
        element: <TransferBalancePage />,
      },
      {
        path: "deposit/:customerId",
        element: <DepositPage />,
      },
      {
        path: "linkbank/:customerId",
        element: <BankLink />,
      },
      {
        path: "deposit/:customerId/:currency",
        element: <DepositPage />,
      },
      {
        path: "card",
        element: <CardPayment />,
      },
      {
        path: "cardiframe",
        element: <CardPaymentIframe />,
      },
      {
        path: "team/:customerId",
        element: <Team />,
      },
      {path: "addteam/:customerId",
        element: <AddTeamMember />,
      },
      {
        path: "homeremit/:customerId",
        element: <HomeRemit />,
      },
      {
        path: "beneficiaries/:customerId",
        element: <Beneficiaries />,
      },
      {
        path: "addbeneficiary/:customerId",
        element: <AddBeneficiary />,
      },
      {
        path: "profile/:customerId",
        element: <Profile />,
      },
    ],
  },

  // Fallback route
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export default router;
