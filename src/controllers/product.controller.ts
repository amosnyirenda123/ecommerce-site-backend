import { Response, Request } from "express";
import Product from "../models/product.model";
import { redis, updateFeaturedProductCache } from "../utils/redis";
import cloudinary from "../utils/cloudinary";

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error: any) {
    console.log("Error in getAllProducts controller", error.message);
    res.status(500).json({ message: "Something went wrong." });
  }
};

export const getFeaturedProducts = async (req: Request, res: Response) => {
  try {
    const featuredProducts = await redis.get("featured_products");
    if (featuredProducts) {
      return res.json(JSON.parse(featuredProducts));
    }

    const products = await Product.find({ isFeatured: true }).lean();

    if (!products) {
      return res.status(404).json({ message: "No featured products found" });
    }
    await redis.set("featured_products", JSON.stringify(products));

    res.json(products);
  } catch (error: any) {
    console.log("Error in getFeaturedProducts controller", error.message);
    res.status(500).json({ message: "Something went wrong." });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  const { name, description, price, image, category } = req.body;
  try {
    let cloudinaryResponse = null;

    if (image) {
      cloudinaryResponse = await cloudinary.uploader.upload(image, {
        folder: "products",
      });
    }

    const product = await Product.create({
      name,
      description,
      price,
      image: cloudinaryResponse?.secure_url
        ? cloudinaryResponse.secure_url
        : "",
      category,
    });

    res.status(201).json(product);
  } catch (error: any) {
    console.log("Error in createProduct controller", error.message);
    res.status(500).json({ message: "Something went wrong." });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  const { productId } = req.params;

  try {
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }
    if (product.image) {
      const publicId = product.image.split("/").pop()?.split(".")[0]; //get image id
      await cloudinary.uploader.destroy(`products/${publicId}`);
    }

    await Product.findByIdAndDelete(productId);

    res.json({ message: "Product deleted successfully" });
  } catch (error: any) {
    console.log("Error in deleteProduct controller", error.message);
    res.status(500).json({ message: "Something went wrong." });
  }
};

export const getRecommendedProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.aggregate([
      {
        $sample: { size: 3 },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          image: 1,
          price: 1,
        },
      },
    ]);

    res.json(products);
  } catch (error: any) {
    console.log("Error in getRecommendedProducts controller", error.message);
    res.status(500).json({ message: "Something went wrong." });
  }
};

export const getProductsByCategory = async (req: Request, res: Response) => {
  const { category } = req.params;

  try {
    const products = await Product.find({ category });
    res.json(products);
  } catch (error: any) {
    console.log("Error in getProductsByCategory controller", error.message);
    res.status(500).json({ message: "Something went wrong." });
  }
};

export const toggleFeaturedProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    product.isFeatured = !product.isFeatured;
    const updatedProduct = await product.save();
    await updateFeaturedProductCache();
    res.json(updatedProduct);
  } catch (error: any) {
    console.log("Error in toggleFeaturedProducts controller", error.message);
    res.status(500).json({ message: "Something went wrong." });
  }
};
