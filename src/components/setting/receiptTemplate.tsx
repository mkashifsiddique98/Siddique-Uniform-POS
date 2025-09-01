"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import BreadCrum from "../custom-components/bread-crum";
import ReceiptTemplate from "@/app/pos/receipt-template";

const ReceiptTemplateForm = () => {
  const [formData, setFormData] = useState({
    shopName: "",
    shopTagline: "",
    shopAddress: "",
    shopPhone: "",
    messageCustomer: "",
    socialMedia: {
      facebook: "",
      tiktok: "",
    },
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [loading, setLoading] = useState(true); // ⬅ Loading state

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/setting/receipt-template");
        const res = await response.json();
        if (res.success && res.data.length > 0) {
          setFormData(res.data[0]);
          setIsEditing(true);
        } else {
          setIsFirstTime(true);
        }
      } catch (error) {
        console.error("Error fetching data", error);
        toast({
          title: "Error",
          description: "An error occurred while fetching data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false); // ⬅ Stop loading
      }
    };

    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.includes("socialMedia.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        socialMedia: {
          ...prev.socialMedia,
          [key]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/setting/receipt-template", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: isEditing
            ? "Receipt template updated successfully!"
            : "Receipt template saved successfully!",
        });
        setIsEditing(true);
        setIsFirstTime(false);
      } else {
        toast({
          title: "Error",
          description: "Error saving receipt template: " + data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting form", error);
      toast({
        title: "Error",
        description: "An error occurred while submitting the form.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <BreadCrum mainfolder="Setting" subfolder="Receipt Template" />

      <div className="flex justify-between gap-4">
        {/* Left side form */}
        {loading ? (
          <div className="space-y-4 w-full">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 container">
            <div>
              <Label htmlFor="shopName">Shop Name</Label>
              <Input
                id="shopName"
                name="shopName"
                value={formData.shopName}
                onChange={handleChange}
                placeholder="Enter shop name"
              />
            </div>
            <div>
              <Label htmlFor="shopTagline">Shop Tagline</Label>
              <Input
                id="shopTagline"
                name="shopTagline"
                value={formData.shopTagline}
                onChange={handleChange}
                placeholder="Enter shop tagline"
              />
            </div>
            <div>
              <Label htmlFor="shopAddress">Shop Address</Label>
              <Input
                id="shopAddress"
                name="shopAddress"
                value={formData.shopAddress}
                onChange={handleChange}
                placeholder="Enter shop address"
              />
            </div>
            <div>
              <Label htmlFor="shopPhone">Shop Phone</Label>
              <Input
                id="shopPhone"
                name="shopPhone"
                value={formData.shopPhone}
                onChange={handleChange}
                placeholder="Enter shop phone"
              />
            </div>
            <div>
              <Label htmlFor="messageCustomer">Customer Message</Label>
              <Input
                id="messageCustomer"
                name="messageCustomer"
                value={formData.messageCustomer}
                onChange={handleChange}
                placeholder="Enter customer message"
              />
            </div>
            <div>
              <Label htmlFor="socialMedia.facebook">Facebook</Label>
              <Input
                id="socialMedia.facebook"
                name="socialMedia.facebook"
                value={formData.socialMedia.facebook}
                onChange={handleChange}
                placeholder="Enter Facebook link"
              />
            </div>
            <div>
              <Label htmlFor="socialMedia.tiktok">TikTok</Label>
              <Input
                id="socialMedia.tiktok"
                name="socialMedia.tiktok"
                value={formData.socialMedia.tiktok}
                onChange={handleChange}
                placeholder="Enter TikTok link"
              />
            </div>
            <Button type="submit" className="w-full">
              {isFirstTime ? "Save" : "Update"}
            </Button>
          </form>
        )}

        {/* Right side receipt preview */}
        <div className="border min-w-[300px] p-2">
          {loading ? (
            <Skeleton className="h-[500px] w-[280px]" />
          ) : (
            <ReceiptTemplate
              shopName={formData.shopName}
              shopTagline={formData.shopTagline}
              shopAddress={formData.shopAddress}
              shopPhone={formData.shopPhone}
              messageCustomer={formData.messageCustomer}
              socialMedia={formData.socialMedia}
              disInPercentage={10}
              discount={100}
              dueDate={new Date()}
              grandTotal={1000}
              invoiceNo={1}
              isRePrint={false}
              productList={[]}
              remainingBalance={0}
              return={false}
              selectedCustomer={{
                customerName: "wakeincustomer",
                type: "wakeincustomer",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptTemplateForm;
