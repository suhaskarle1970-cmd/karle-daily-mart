import StoreConfig from "../models/Config.js";

export async function getConfig(req, res, next) {
  try {
    let config = await StoreConfig.findOne().lean();

    if (!config) {
      config = await StoreConfig.create({});
      config = config.toObject();
    }

    res.json(config);
  } catch (err) {
    next(err);
  }
}

export async function updateConfig(req, res, next) {
  try {
    const { delivery } = req.body;

    if (!delivery) {
      return res.status(400).json({
        message: "Delivery settings are required.",
      });
    }

    const minimumOrderAmount = Number(delivery.minimumOrderAmount);

    const firstDeliveryBandAmount = Number(delivery.firstDeliveryBandAmount);

    const chargePerAmount = Number(delivery.chargePerAmount);

    const chargePerAmountValue = Number(delivery.chargePerAmountValue);

    if (Number.isNaN(minimumOrderAmount) || minimumOrderAmount < 0) {
      return res.status(400).json({
        message: "Minimum order amount must be valid.",
      });
    }

    if (
      !Number.isFinite(firstDeliveryBandAmount) ||
      firstDeliveryBandAmount < 0
    ) {
      return res.status(400).json({
        message: "First delivery band amount must be a valid number.",
      });
    }

    if (Number.isNaN(chargePerAmount) || chargePerAmount <= 0) {
      return res.status(400).json({
        message: "Charge per amount must be greater than 0.",
      });
    }

    if (Number.isNaN(chargePerAmountValue) || chargePerAmountValue < 0) {
      return res.status(400).json({
        message: "Delivery charge must be valid.",
      });
    }

    const config = await StoreConfig.findOneAndUpdate(
      {},
      {
        $set: {
          "delivery.enabled": Boolean(delivery.enabled),

          "delivery.minimumOrderAmount": minimumOrderAmount,

          "delivery.firstDeliveryBandAmount": firstDeliveryBandAmount,

          "delivery.chargePerAmount": chargePerAmount,

          "delivery.chargePerAmountValue": chargePerAmountValue,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    ).lean();

    res.json({
      message: "Delivery settings updated successfully.",
      config,
    });
  } catch (err) {
    next(err);
  }
}
