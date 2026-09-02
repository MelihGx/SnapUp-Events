"use strict";

const { buildPricingPayload } = require("../services/pricingService");

function getRegionalPricing(req, res) {
  const pricing = buildPricingPayload(req, req.query.country);

  return res.status(200).json({
    success: true,
    ...pricing,
  });
}

module.exports = {
  getRegionalPricing,
};
