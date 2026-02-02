// src/router/router.js - COMPLETE UPDATED VERSION
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { lazy, Suspense } from "react";

// ✅ Keep Login static - it's the entry point
import Login from "../src/features/Auth/Login/Login";

// ✅ IMPORTANT: Import route guards statically
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";

// ✅ CRITICAL: Lazy load ALL heavy components
const SignUpIndividual = lazy(
  () => import("../src/features/Auth/SignUp/SignUpIndividual"),
);
const SignUpInstitution = lazy(
  () => import("../src/features/Auth/SignUp/SignUpInstitution"),
);
const SelectAccountType = lazy(
  () => import("../src/features/Auth/Registration/AccountType"),
);
const OpenCurrencyAccount = lazy(
  () =>
    import("../src/features/Auth/SignUp/SelectCurrencyAccount/CurrencySelectAccount"),
);
const PhoneVerification = lazy(
  () => import("../src/features/Auth/Verification/PhoneVerification"),
);
const PlaidCallback = lazy(
  () => import("../src/features/Auth/Registration/Plaid/PlaidCallback"),
);
const ForgotPassword = lazy(
  () => import("../src/features/Auth/Password/ForgotPassword"),
);

// ✅ CRITICAL: Lazy load heavy pages that were in the warning
const Home = lazy(() => import("../src/page/Home/Homepage"));
const HomeRemit = lazy(() => import("../src/page/Home/HomeRemit"));
const Convert = lazy(() => import("../src/page/Conversion/Convert"));

// ✅ EXTREMELY CRITICAL: Lazy load Deposit and Payment components (3.2MB bundle)
const DepositPage = lazy(() => import("../src/page/Deposit/DepositPage"));
const DepositPageIframe = lazy(
  () => import("../src/page/Deposit/DepositPageIframe"),
);
const CardPayment = lazy(
  () => import("../src/page/Deposit/components/Card/CardPayment"),
);
const CardPaymentIframe = lazy(
  () => import("../src/page/Deposit/components/Card/CardPaymentIframe"),
);
const BankLink = lazy(() => import("../src/page/Deposit/components/BankLink"));
const BankLinkIframe = lazy(
  () => import("../src/page/Deposit/components/BankLinkIframe"),
);
const CardPaymentSuccess = lazy(
  () => import("../src/page/Deposit/components/Card/CardPaymentSuccess"),
);

// ✅ CRITICAL: Lazy load Payout page
const PayoutPage = lazy(() => import("../src/page/Payout/PayoutPage"));

// Lazy load other heavy components
const Beneficiaries = lazy(
  () => import("../src/page/Beneficiary/MyBeneficiaries/Beneficiaries"),
);
const AddBeneficiary = lazy(
  () => import("../src/page/Beneficiary/AddBeneficiary/AddBeneficiary"),
);
const EditBeneficiary = lazy(
  () => import("../src/page/Beneficiary/EditBeneficiary/EditBeneficiary"),
);
const PublicBeneficiaryRegistration = lazy(
  () => import("../src/page/Beneficiary/AddBeneficiary/PublicBeneficiaryForm"),
);
const BeneficiaryHomepage = lazy(
  () => import("../src/page/RequestRemit/Homepage/BeneficiaryHomepage"),
);
const BeneficiariesProfile = lazy(
  () => import("../src/components/RequestRemit/Profile/BeneficiariesProfile"),
);
const Profile = lazy(() => import("../src/page/Profile/Profile"));
const TransferBalancePage = lazy(
  () => import("../src/page/Transfer/TransferBalancePage"),
);
const Team = lazy(() => import("../src/page/Team/Team"));
const AddTeamMember = lazy(() => import("../src/page/Team/AddNewMember"));
const BankLetter = lazy(() => import("../src/page/BankLetter/BankLetter"));
const Remittance = lazy(() => import("../src/page/Remittance/remittance"));
const MonthlyTransactions = lazy(
  () =>
    import("../src/components/Dashboard/Account/Transaction/MonthlyTransactions"),
);
const SelectCountry = lazy(
  () => import("../src/features/Auth/SignUp/SelectCountry"),
);
const AllTransactions = lazy(
  () =>
    import("../src/components/Dashboard/Account/Transaction/AllTransactions"),
);
const BeneficiaryLayout = lazy(() => import("./BeneficiaryLayout"));
const BeneficiaryTransactions = lazy(
  () => import("../src/page/RequestRemit/Transactions/BeneficiaryTransactions"),
);
const BeneficiarySenders = lazy(
  () => import("../src/page/RequestRemit/Senders/BeneficiarySenders"),
);

// ✅ Shared Loading Component
const PageLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
    <div className="text-center">
      <div className="relative inline-block mb-4">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
      <p className="text-gray-600 text-sm">Loading page...</p>
    </div>
  </div>
);

// ✅ Helper function to wrap components with Suspense
const withSuspense = (Component) => (
  <Suspense fallback={<PageLoading />}>
    <Component />
  </Suspense>
);

const router = createBrowserRouter([
  // Public routes - only accessible when not authenticated
  {
    path: "/",
    element: <PublicRoute />,
    children: [
      {
        index: true,
        element: <Login />, // Keep static - first page
      },
      {
        path: "selectaccounttype",
        element: withSuspense(SelectAccountType),
      },
      {
        path: "selectcountry",
        element: withSuspense(SelectCountry),
      },
      {
        path: "signupindividual",
        element: withSuspense(SignUpIndividual), // ✅ Now lazy loaded
      },
      {
        path: "signupinstitution",
        element: withSuspense(SignUpInstitution),
      },
      {
        path: "opencurrencyaccount",
        element: withSuspense(OpenCurrencyAccount),
      },
      {
        path: "phoneverification",
        element: withSuspense(PhoneVerification),
      },
      {
        path: "forgotpassword",
        element: withSuspense(ForgotPassword),
      },
      {
        path: "plaidcallback",
        element: withSuspense(PlaidCallback),
      },
      {
        path: "linkbankiframe/:customerId/:requestId/:accessToken",
        element: withSuspense(BankLinkIframe),
      },
      {
        path: "depositiframe/:customerId/:authtoken/:uniqueReference/:instructedAmount",
        element: withSuspense(DepositPageIframe), // ✅ Now lazy loaded
      },
      {
        path: "register-beneficiary",
        element: withSuspense(PublicBeneficiaryRegistration),
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
        element: withSuspense(Home),
      },
      {
        path: "monthlytransactions/:customerId",
        element: withSuspense(MonthlyTransactions),
      },
      {
        path: "alltransactions/:customerId",
        element: withSuspense(AllTransactions),
      },
      {
        path: "transfer/:customerId",
        element: withSuspense(TransferBalancePage),
      },
      // ✅ CRITICAL: Deposit routes now lazy loaded
      {
        path: "deposit/:customerId",
        element: withSuspense(DepositPage), // ✅ Now lazy loaded
      },
      {
        path: "convert/:customerId",
        element: withSuspense(Convert),
      },
      {
        path: "linkbank/:customerId",
        element: withSuspense(BankLink),
      },
      {
        path: "deposit/:customerId/:currency",
        element: withSuspense(DepositPage), // ✅ Now lazy loaded
      },
      // ✅ CRITICAL: Payment routes now lazy loaded
      {
        path: "card",
        element: withSuspense(CardPayment), // ✅ Now lazy loaded
      },
      {
        path: "/card/success",
        element: withSuspense(CardPaymentSuccess),
      },
      {
        path: "cardiframe",
        element: withSuspense(CardPaymentIframe), // ✅ Now lazy loaded
      },
      {
        path: "team/:customerId",
        element: withSuspense(Team),
      },
      {
        path: "addteam/:customerId",
        element: withSuspense(AddTeamMember),
      },
      {
        path: "homeremit/:customerId",
        element: withSuspense(HomeRemit),
      },
      {
        path: "profile/:customerId",
        element: withSuspense(Profile),
      },
      // ✅ CRITICAL: Payout route now lazy loaded
      {
        path: "payout/:customerId",
        element: withSuspense(PayoutPage), // ✅ Now lazy loaded
      },
      {
        path: "remittance/:customerId",
        element: withSuspense(Remittance),
      },
      {
        path: "/bankletter/:accountId",
        element: withSuspense(BankLetter),
      },

      // ✅ CUSTOMER BENEFICIARY MANAGEMENT ROUTES (lazy loaded)
      {
        path: "beneficiaries/:customerId",
        element: withSuspense(Beneficiaries),
      },
      {
        path: "addbeneficiary/:customerId",
        element: withSuspense(AddBeneficiary),
      },
      {
        path: "editbeneficiary/:beneficiaryId",
        element: withSuspense(EditBeneficiary),
      },
    ],
  },

  // ==================== BENEFICIARY PORTAL ROUTES ====================
  {
    path: "/beneficiary",
    element: withSuspense(BeneficiaryLayout),
    children: [
      {
        path: "profile/:beneficiaryId",
        element: withSuspense(BeneficiariesProfile),
      },
      {
        path: "homepage/:beneficiaryId",
        element: withSuspense(BeneficiaryHomepage),
      },
      {
        path: "transactions/:beneficiaryId",
        element: withSuspense(BeneficiaryTransactions),
      },
      {
        path: "senders/:beneficiaryId",
        element: withSuspense(BeneficiarySenders),
      },
    ],
  },

  // ==================== LEGACY ROUTES ====================
  {
    path: "/benefprofile/:beneficiaryId",
    element: withSuspense(BeneficiaryLayout),
    children: [
      {
        index: true,
        element: withSuspense(BeneficiariesProfile),
      },
    ],
  },
  {
    path: "/benefhomepage/:beneficiaryId",
    element: withSuspense(BeneficiaryLayout),
    children: [
      {
        index: true,
        element: withSuspense(BeneficiaryHomepage),
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
