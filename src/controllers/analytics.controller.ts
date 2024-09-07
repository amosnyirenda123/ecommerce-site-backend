import { Request, Response } from "express";
import User from "../models/user.model";
import Product from "../models/product.model";
import Order from "../models/order.model";

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const analyticsData = await getAnalyticsData();

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days back

    const dailySalesData = await getDailySalesData(startDate, endDate);

    res.json({
      analyticsData,
      dailySalesData,
    });
  } catch (error: any) {
    console.log("Error in getAnalytics controller", error.message);
    res.status(500).json({ message: "Something went wrong." });
  }
};

async function getAnalyticsData() {
  const totalNumberOfUsers = await User.countDocuments();
  const totalNumberOfProducts = await Product.countDocuments();

  const salesData = await Order.aggregate([
    {
      $group: {
        _id: null, // groups all documents together
        totalSales: { $sum: 1 },
        totalRevenue: { $sum: "$totalAmount" },
      },
    },
  ]);

  const { totalSales, totalRevenue } = salesData[0] || {
    totalSales: 0,
    totalRevenue: 0,
  };

  return {
    users: totalNumberOfUsers,
    products: totalNumberOfProducts,
    totalSales,
    totalRevenue,
  };
}

async function getDailySalesData(startDate: Date, endDate: Date) {
  try {
    const dailySalesData = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sales: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // example of dailySalesData
    // [
    // 	{
    // 		_id: "2024-08-18",
    // 		sales: 12,
    // 		revenue: 1450.75
    // 	},
    // ]

    const dateArray = getDatesInRange(startDate, endDate);
    // console.log(dateArray) // ['2024-08-18', '2024-08-19', ... ]

    return dateArray.map((date) => {
      const foundData = dailySalesData.find((item) => item._id === date);

      return {
        date,
        sales: foundData?.sales || 0,
        revenue: foundData?.revenue || 0,
      };
    });
  } catch (error) {
    throw error;
  }
}

function getDatesInRange(startDate: Date, endDate: Date) {
  const dates = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split("T")[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}
