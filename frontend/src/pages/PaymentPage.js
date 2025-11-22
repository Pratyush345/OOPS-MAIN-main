// PaymentPage.js
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { ordersAPI } from "@/api/api";
import { toast } from "sonner";
import { CreditCard, Lock } from "lucide-react";

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loadRetailerStats } = useAuth();

  // Get order data passed from checkout
  const { items, deliveryAddress, total, cartItems } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");

  // Format card number with spaces
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  // Format expiry date MM/YY
  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.slice(0, 2) + "/" + v.slice(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, "").length <= 16) {
      setCardNumber(formatted);
    }
  };

  const handleExpiryChange = (e) => {
    const formatted = formatExpiryDate(e.target.value);
    if (formatted.replace(/\//g, "").length <= 4) {
      setExpiryDate(formatted);
    }
  };

  const handleCvvChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/gi, "");
    if (value.length <= 3) {
      setCvv(value);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!cardNumber || cardNumber.replace(/\s/g, "").length < 16) {
      toast.error("Please enter a valid 16-digit card number");
      return;
    }

    if (!cardName.trim()) {
      toast.error("Please enter cardholder name");
      return;
    }

    if (!expiryDate || expiryDate.length < 5) {
      toast.error("Please enter expiry date (MM/YY)");
      return;
    }

    if (!cvv || cvv.length < 3) {
      toast.error("Please enter CVV");
      return;
    }

    setLoading(true);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Create order with card payment
      const payload = {
        items: items,
        delivery_address: deliveryAddress,
        payment_method: "card",
        card_last4: cardNumber.slice(-4),
      };

      console.log("🎯 Placing card payment order:", payload);
      const response = await ordersAPI.create(user.id, payload);
      console.log("✅ Order created:", response.data);

      // Update seller stats
      if (cartItems) {
        const sellerIds = [
          ...new Set(cartItems.map((it) => it.product?.seller_id).filter(id => id && id !== "unknown")),
        ];
        sellerIds.forEach((sid) => {
          if (loadRetailerStats) {
            loadRetailerStats(sid);
          }
        });
      }

      toast.success("Payment successful! Order placed.");
      navigate(`/order/${response.data.id}`);
    } catch (error) {
      console.error("❌ Payment error:", error);
      toast.error(error.response?.data?.detail || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!items || !deliveryAddress) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p className="text-gray-600 mb-4">No payment information found.</p>
          <Button onClick={() => navigate("/cart")}>Go to Cart</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Payment</h1>
          <p className="text-gray-600 mt-2">Complete your purchase securely</p>
        </div>

        <form onSubmit={handlePayment}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Card Details
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Card Number */}
              <div>
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  maxLength={19}
                  required
                  className="text-lg tracking-wider"
                />
              </div>

              {/* Cardholder Name */}
              <div>
                <Label htmlFor="cardName">Cardholder Name</Label>
                <Input
                  id="cardName"
                  type="text"
                  placeholder="JOHN DOE"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                  required
                />
              </div>

              {/* Expiry and CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input
                    id="expiry"
                    type="text"
                    placeholder="MM/YY"
                    value={expiryDate}
                    onChange={handleExpiryChange}
                    maxLength={5}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    type="text"
                    placeholder="123"
                    value={cvv}
                    onChange={handleCvvChange}
                    maxLength={3}
                    required
                  />
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-gray-50 p-3 rounded-lg flex items-start gap-2">
                <Lock className="h-4 w-4 text-green-600 mt-0.5" />
                <p className="text-xs text-gray-600">
                  Your payment information is encrypted and secure. We never store your card details.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Items ({items?.length || 0})</span>
                  <span>₹{total?.toLocaleString("en-IN") || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery</span>
                  <span className="text-green-600">FREE</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>₹{total?.toLocaleString("en-IN") || 0}</span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full mt-6"
              >
                {loading ? "Processing Payment..." : `Pay ₹${total?.toLocaleString("en-IN") || 0}`}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full mt-2"
                onClick={() => navigate("/checkout")}
                disabled={loading}
              >
                Back to Checkout
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default PaymentPage;
