import React from "react";
import { Header } from "../src/features/common/header/components/Header";
import CategoryViewContainer from "../src/features/routes/category-item-list/components/CategoryViewContainer";

const page = () => {
  return (
    <div>
      <Header title="Category View" />
      <CategoryViewContainer />
    </div>
  );
};

export default page;
