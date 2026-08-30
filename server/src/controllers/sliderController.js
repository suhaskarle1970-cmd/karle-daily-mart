import Slider from "../models/Slider.js";
import { uploadImageBuffer, deleteImage } from "../config/cloudinary.js";

export async function listSliders(req, res, next) {
  try {
    const { includeInactive } = req.query;
    const filter = includeInactive === "true" ? {} : { active: true };
    const sliders = await Slider.find(filter).sort({ order: 1, createdAt: 1 });
    res.json({ sliders });
  } catch (err) {
    next(err);
  }
}

export async function createSlider(req, res, next) {
  try {
    const { heading, description, ctaText, ctaLink, active, order } = req.body;
    // if (!heading) return res.status(400).json({ message: "Heading is required." });
    if (!req.file) return res.status(400).json({ message: "Banner image is required." });

    const uploaded = await uploadImageBuffer(req.file.buffer, { folder: "sliders" });

    const slider = await Slider.create({
      heading,
      description,
      ctaText,
      ctaLink,
      active: active === undefined ? true : active === "true" || active === true,
      order: order !== undefined ? Number(order) : 0,
      imageUrl: uploaded.url,
      imagePublicId: uploaded.publicId,
    });

    res.status(201).json({ slider });
  } catch (err) {
    next(err);
  }
}

export async function updateSlider(req, res, next) {
  try {
    const slider = await Slider.findById(req.params.id);
    if (!slider) return res.status(404).json({ message: "Slider not found." });

    const { heading, description, ctaText, ctaLink, active, order } = req.body;
    if (heading !== undefined) slider.heading = heading;
    if (description !== undefined) slider.description = description;
    if (ctaText !== undefined) slider.ctaText = ctaText;
    if (ctaLink !== undefined) slider.ctaLink = ctaLink;
    if (active !== undefined) slider.active = active === "true" || active === true;
    if (order !== undefined) slider.order = Number(order);

    if (req.file) {
      const oldPublicId = slider.imagePublicId;
      const uploaded = await uploadImageBuffer(req.file.buffer, { folder: "sliders" });
      slider.imageUrl = uploaded.url;
      slider.imagePublicId = uploaded.publicId;
      if (oldPublicId) await deleteImage(oldPublicId);
    }

    await slider.save();
    res.json({ slider });
  } catch (err) {
    next(err);
  }
}

export async function deleteSlider(req, res, next) {
  try {
    const slider = await Slider.findByIdAndDelete(req.params.id);
    if (!slider) return res.status(404).json({ message: "Slider not found." });
    if (slider.imagePublicId) await deleteImage(slider.imagePublicId);
    res.json({ message: "Slider deleted." });
  } catch (err) {
    next(err);
  }
}
