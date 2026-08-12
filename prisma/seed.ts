import { prisma } from '../src/config/db';
import { UserRole, UserStatus, ItemStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

async function main() {
  console.log('Seeding initial database data into PostgreSQL...');

  // 1. Seed Demo Users
  const passwordHash = await bcrypt.hash('Password123', 10);

  const demoUser = await prisma.user.upsert({
    where: { email: 'user@craftnest.com' },
    update: {},
    create: {
      name: 'Elena Rostova',
      email: 'user@craftnest.com',
      passwordHash,
      authProvider: 'local',
      role: UserRole.user,
      bio: 'Master artisan creating handmade ceramics and glass art.',
      location: 'Seattle, WA',
      phone: '+1 (555) 234-5678',
      status: UserStatus.active,
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Elena',
    },
  });

  const demoAdmin = await prisma.user.upsert({
    where: { email: 'admin@craftnest.com' },
    update: {},
    create: {
      name: 'Admin CraftNest',
      email: 'admin@craftnest.com',
      passwordHash,
      authProvider: 'local',
      role: UserRole.admin,
      bio: 'Platform Administrator',
      location: 'Austin, TX',
      phone: '+1 (555) 987-6543',
      status: UserStatus.active,
      avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Admin',
    },
  });

  console.log(`Created demo users: ${demoUser.email}, ${demoAdmin.email}`);

  // 2. Seed Categories
  const categories = [
    { name: 'Ceramics', description: 'Hand-thrown pottery and kilned clay works', image: '/images/seed/ceramic-bowl.png' },
    { name: 'Woodworking', description: 'Solid wood furniture and carved art', image: '/images/seed/oak-table.png' },
    { name: 'Leather Goods', description: 'Hand-stitched leather apparel and accessories', image: '/images/seed/leather-bag.png' },
    { name: 'Jewelry', description: 'Custom forged metals and precious stones', image: '/images/seed/earrings.png' },
    { name: 'Textiles', description: 'Woven fabrics and hand-dyed yarns', image: '/images/seed/scarf.png' },
    { name: 'Glass Art', description: 'Blown glass and stained glass decor', image: '/images/seed/glass-pendant.png' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: { description: cat.description, image: cat.image },
      create: cat,
    });
  }
  console.log(`Seeded ${categories.length} categories.`);

  // 3. Seed Items
  const items = [
    {
      title: 'Handcrafted Oak Table',
      shortDescription: 'Solid oak dining table for 6 people.',
      fullDescription: 'Beautiful handcrafted solid oak dining table built from sustainably harvested wood with protective matte varnish.',
      price: 450,
      category: 'Woodworking',
      images: ['https://images.unsplash.com/photo-1538688525198-9b88f6f53126?q=80&w=800'],
      quantity: 2,
      location: 'Seattle, WA',
      avgRating: 4.8,
      reviewCount: 5,
      status: ItemStatus.approved,
      ownerId: demoUser.id,
    },
    {
      title: 'Leather Crossbody Bag',
      shortDescription: 'Genuine hand-stitched leather crossbody bag.',
      fullDescription: 'Stitched entirely by hand using premium vegetable-tanned leather and brass hardware.',
      price: 120,
      category: 'Leather Goods',
      images: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=800'],
      quantity: 15,
      location: 'Austin, TX',
      avgRating: 5.0,
      reviewCount: 12,
      status: ItemStatus.approved,
      ownerId: demoUser.id,
    },
    {
      title: 'Blown Glass Pendant',
      shortDescription: 'Unique blown glass lighting pendant.',
      fullDescription: 'Hand-blown glass pendant for modern home lighting with adjustable cord.',
      price: 210,
      category: 'Glass Art',
      images: ['https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=800'],
      quantity: 8,
      location: 'Portland, OR',
      avgRating: 4.5,
      reviewCount: 8,
      status: ItemStatus.approved,
      ownerId: demoUser.id,
    },
    {
      title: 'Ceramic Serving Bowl',
      shortDescription: 'Large ceramic hand-glazed serving bowl.',
      fullDescription: 'Perfect for salads or pasta. Food safe and dishwasher friendly.',
      price: 65,
      category: 'Ceramics',
      images: ['https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=800'],
      quantity: 10,
      location: 'New York, NY',
      avgRating: 4.2,
      reviewCount: 3,
      status: ItemStatus.approved,
      ownerId: demoUser.id,
    },
    {
      title: 'Silver Pearl Earrings',
      shortDescription: 'Sterling silver and freshwater pearl earrings.',
      fullDescription: 'Elegant drop earrings made from 925 sterling silver and natural freshwater pearls.',
      price: 95,
      category: 'Jewelry',
      images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800'],
      quantity: 20,
      location: 'Chicago, IL',
      avgRating: 4.9,
      reviewCount: 22,
      status: ItemStatus.approved,
      ownerId: demoUser.id,
    },
    {
      title: 'Hand-Dyed Indigo Scarf',
      shortDescription: 'Silk scarf with natural indigo dye.',
      fullDescription: 'Luxurious silk scarf hand-dyed using traditional shibori indigo resist dyeing methods.',
      price: 45,
      category: 'Textiles',
      images: ['https://images.unsplash.com/photo-1601924994987-69e26d50dc26?q=80&w=800'],
      quantity: 30,
      location: 'Denver, CO',
      avgRating: 4.0,
      reviewCount: 1,
      status: ItemStatus.approved,
      ownerId: demoUser.id,
    },
  ];

  for (const itemData of items) {
    const existing = await prisma.item.findFirst({ where: { title: itemData.title } });
    if (!existing) {
      await prisma.item.create({ data: itemData });
    }
  }
  console.log(`Seeded ${items.length} sample items.`);

  // 4. Seed Blog Posts
  const blogPosts = [
    {
      slug: 'art-of-ceramic-glazing',
      title: 'The Art of Ceramic Glazing',
      coverImage: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?q=80&w=800',
      content: 'Discover the hidden techniques master artisans use to achieve perfect glass-like finishes on their pottery.',
      tags: ['Ceramics', 'Guide', 'Artisan'],
    },
    {
      slug: 'sustainable-leather-sourcing',
      title: 'Sustainable Leather Sourcing',
      coverImage: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=800',
      content: 'How ethical tanneries are changing the landscape of handmade leather goods without compromising quality.',
      tags: ['Leather', 'Sustainability', 'Craft'],
    },
    {
      slug: 'mastering-wood-joinery',
      title: 'Mastering Wood Joinery',
      coverImage: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?q=80&w=800',
      content: 'A beginner guide to understanding dovetails, mortise, and tenon joints in custom furniture design.',
      tags: ['Woodworking', 'Furniture', 'Tutorial'],
    },
  ];

  for (const post of blogPosts) {
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: { title: post.title, coverImage: post.coverImage, content: post.content },
      create: post,
    });
  }
  console.log(`Seeded ${blogPosts.length} blog posts.`);

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
