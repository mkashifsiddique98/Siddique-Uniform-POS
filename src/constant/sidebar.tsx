import {
  AreaChart,
  FileBox,
  FilePlus2,
  FileSignature,
  FileStack,
  User,
  School,
  SquareStack,
  GitGraph,
  ShoppingCart,
  ScrollText,
  Layers,
  Coins,
  ListCollapse,
  Barcode,
  ScanBarcode,
} from "lucide-react";

export const sidebarItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: <AreaChart />,
  },
  {
    title: "Product",
    href: "#",
    icon: <FileBox />,
    subItems: [
      {
        title: "All Product",
        href: "/product/list",
        icon: <FileStack />,
      },
      {
        title: "Create Product",
        href: "/product/create",
        icon: <FilePlus2 />,
      },
      {
        title: "School Name",
        href: "/product/school-name",
        icon: <School />,
      },
      {
        title: "Category & Size",
        href: "/product/category-size",
        icon: <SquareStack />,
      },
      {
        title: "Generate Code",
        href: "/product/generate-code",
        icon: <ScanBarcode />,
      },
    ],
  },
  {
    title: "Purchase",
    href: "/purchase",
    icon: <ShoppingCart />,
    subItems: [
     {
        title: "Made Purchase",
        href: "/purchase",
        icon: <ScrollText />,
      },
      {
        title: "List Purchase",
        href: "/purchase/list",
        icon: <ListCollapse />,
      },
      {
        title: "Whole Saler",
        href: "/purchase/wholesaler",
        icon: <Layers />,
      },
    ],
  },

  {
    title: "Sales",
    href: "/invoice",
    icon: <GitGraph />,
    subItems: [
      {
        title: "Daily Invoice",
        href: "/invoice",
        icon: <Coins />,
      },
      {
        title: "Special Order",
        href: "/invoice/special-order",
        icon: <ScrollText />,
      },
    ]
  },
  {
    title: "Users",
    href: "#",
    icon: <User />,
  },
];
