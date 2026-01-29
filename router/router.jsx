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
import Convert from "../src/page/Conversion/Convert";

// Import Beneficiary Components
import Beneficiaries from "../src/page/Beneficiary/MyBeneficiaries/Beneficiaries";
import AddBeneficiary from "../src/page/Beneficiary/AddBeneficiary/AddBeneficiary";
import EditBeneficiary from "../src/page/Beneficiary/EditBeneficiary/EditBeneficiary";
import PublicBeneficiaryRegistration from "../src/page/Beneficiary/AddBeneficiary/PublicBeneficiaryForm";

// Request Remit
import BeneficiaryHomepage from "../src/page/RequestRemit/Homepage/BeneficiaryHomepage";
import BeneficiariesProfile from "../src/components/RequestRemit/Profile/BeneficiariesProfile";

// Import route guards
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";

import URLDebugger from "./URLDebugger";
import Profile from "../src/page/Profile/Profile";
import TransferBalancePage from "../src/page/Transfer/TransferBalancePage";
import DepositPage from "../src/page/Deposit/DepositPage";
import DepositPageIframe from "../src/page/Deposit/DepositPageIframe";
import BankLink from "../src/page/Deposit/components/BankLink";
import BankLinkIframe from "../src/page/Deposit/components/BankLinkIframe";
import CardPayment from "../src/page/Deposit/components/Card/CardPayment";
import CardPaymentIframe from "../src/page/Deposit/components/Card/CardPaymentIframe";
import Team from "../src/page/Team/Team";
import AddTeamMember from "../src/page/Team/AddNewMember";
import PayoutPage from "../src/page/Payout/PayoutPage";
import BankLetter from "./../src/page/BankLetter/BankLetter";
import Remittance from "../src/page/Remittance/remittance";
import CardPaymentSuccess from "../src/page/Deposit/components/Card/CardPaymentSuccess";
import MonthlyTransactions from "../src/components/Dashboard/Account/Transaction/MonthlyTransactions";
import SelectCountry from "../src/features/Auth/SignUp/SelectCountry";
import AllTransactions from "../src/components/Dashboard/Account/Transaction/AllTransactions";

// ✅ Import the Beneficiary Layout Component
import BeneficiaryLayout from "./BeneficiaryLayout";
import BeneficiaryTransactions from "../src/page/RequestRemit/Transactions/BeneficiaryTransactions";
import BeneficiarySenders from "../src/page/RequestRemit/Senders/BeneficiarySenders";

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
        path: "selectcountry",
        element: <SelectCountry />,
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
      {
        path: "linkbankiframe/:customerId/:requestId/:accessToken",
        element: <BankLinkIframe />,
      },
      {
        path: "depositiframe/:customerId/:authtoken/:uniqueReference/:instructedAmount",
        element: <DepositPageIframe />,
      },
      {
        path: "register-beneficiary",
        element: <PublicBeneficiaryRegistration />,
      },
    ],
  },

  // ==================== CUSTOMER PORTAL ROUTES ====================
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        path: "home/:customerId",
        element: <Home />,
      },
      {
        path: "monthlytransactions/:customerId",
        element: <MonthlyTransactions />,
      },
      {
        path: "alltransactions/:customerId",
        element: <AllTransactions />,
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
        path: "convert/:customerId",
        element: <Convert />,
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
        path: "/card/success",
        element: <CardPaymentSuccess />,
      },
      {
        path: "cardiframe",
        element: <CardPaymentIframe />,
      },
      {
        path: "team/:customerId",
        element: <Team />,
      },
      {
        path: "addteam/:customerId",
        element: <AddTeamMember />,
      },
      {
        path: "homeremit/:customerId",
        element: <HomeRemit />,
      },
      {
        path: "profile/:customerId",
        element: <Profile />,
      },
      {
        path: "payout/:customerId",
        element: <PayoutPage />,
      },
      {
        path: "remittance/:customerId",
        element: <Remittance />,
      },
      {
        path: "/bankletter/:accountId",
        element: <BankLetter />,
      },

      // ✅ CUSTOMER BENEFICIARY MANAGEMENT ROUTES
      {
        path: "beneficiaries/:customerId",
        element: <Beneficiaries />,
      },
      {
        path: "addbeneficiary/:customerId",
        element: <AddBeneficiary />,
      },
      {
        path: "editbeneficiary/:beneficiaryId",
        element: <EditBeneficiary />,
      },
    ],
  },

  // ==================== BENEFICIARY PORTAL ROUTES ====================
  // COMPLETELY SEPARATE - NOT wrapped in ProtectedRoute
  // These routes will NOT have the customer header from ProtectedRoute
  {
    path: "/beneficiary",
    element: <BeneficiaryLayout />, // ✅ Directly use BeneficiaryLayout, NOT ProtectedRoute
    children: [
      // Beneficiary Profile
      {
        path: "profile/:beneficiaryId",
        element: <BeneficiariesProfile />,
      },
      // Beneficiary Dashboard/Homepage
      {
        path: "homepage/:beneficiaryId",
        element: <BeneficiaryHomepage />,
      },
      {
        path: "transactions/:beneficiaryId",
        element: <BeneficiaryTransactions />,
      },
      {
        path: "senders/:beneficiaryId",
        element: <BeneficiarySenders />,
      },
    ],
  },

  // ==================== LEGACY ROUTES ====================
  // Also separate - NOT wrapped in ProtectedRoute
  {
    path: "/benefprofile/:beneficiaryId",
    element: <BeneficiaryLayout />,
    children: [
      {
        index: true,
        element: <BeneficiariesProfile />,
      },
    ],
  },
  {
    path: "/benefhomepage/:beneficiaryId",
    element: <BeneficiaryLayout />,
    children: [
      {
        index: true,
        element: <BeneficiaryHomepage />,
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
