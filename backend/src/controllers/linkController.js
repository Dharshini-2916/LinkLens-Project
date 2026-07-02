import Link from '../models/Link.js';
import Click from '../models/Click.js';
import { generateShortCode } from '../utils/codeGenerator.js';
import validator from 'validator';

/**
 * @desc    Create a new short link
 * @route   POST /api/links
 * @access  Private
 */
export const createLink = async (req, res, next) => {
  try {
    const { originalUrl, customAlias, expiryDate } = req.body;

    // 1. Validate URL format
    if (!validator.isURL(originalUrl, { require_protocol: true })) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid URL (must start with http:// or https://)',
      });
    }

    // 2. Generate short code or use custom alias
    let shortCode;
    if (customAlias) {
      // Check if custom alias is already taken
      const existingAlias = await Link.findOne({ customAlias: customAlias.toLowerCase() });
      if (existingAlias) {
        return res.status(400).json({
          success: false,
          message: 'This custom alias is already taken. Please choose another one.',
        });
      }
      shortCode = customAlias.toLowerCase();
    } else {
      // Generate unique short code
      shortCode = generateShortCode();
      // Ensure uniqueness (very rare collision with nanoid, but just in case)
      let existingCode = await Link.findOne({ shortCode });
      while (existingCode) {
        shortCode = generateShortCode();
        existingCode = await Link.findOne({ shortCode });
      }
    }

    // 3. Create link
    console.log("Creating link...");
    console.log("originalUrl:", originalUrl);
    console.log("shortCode:", shortCode);
    console.log("customAlias:", customAlias);

    const link = await Link.create({
      user: req.user._id,
      originalUrl,
      shortCode,
      customAlias: customAlias ? customAlias.toLowerCase() : null,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
    });

    res.status(201).json({
      success: true,
      data: link,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all links for authenticated user
 * @route   GET /api/links
 * @access  Private
 * @query   search, status, sort
 */
export const getLinks = async (req, res, next) => {
  try {
    const { search, status, sort } = req.query;
    const userId = req.user._id;

    // Build query filter
    const filter = { user: userId };

    // Search filter
    if (search) {
      filter.$or = [
        { originalUrl: { $regex: search, $options: 'i' } },
        { shortCode: { $regex: search, $options: 'i' } },
        { customAlias: { $regex: search, $options: 'i' } },
      ];
    }

    // Status filter
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Build sort object
    let sortOption = { createdAt: -1 }; // Default: newest first
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    else if (sort === 'most-clicked') sortOption = { clickCount: -1 };
    else if (sort === 'least-clicked') sortOption = { clickCount: 1 };

    // Fetch links
    const links = await Link.find(filter).sort(sortOption).lean();

    // Update status for expired links
    const now = new Date();
    const updatedLinks = links.map((link) => {
      if (link.expiryDate && new Date(link.expiryDate) < now && link.status === 'Active') {
        link.status = 'Expired';
        // Update in database (async, don't wait)
        Link.updateOne({ _id: link._id }, { status: 'Expired' }).catch(console.error);
      }
      return link;
    });

    res.status(200).json({
      success: true,
      count: updatedLinks.length,
      links: updatedLinks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single link details
 * @route   GET /api/links/:id
 * @access  Private
 */
export const getLinkById = async (req, res, next) => {
  try {
    const link = await Link.findById(req.params.id);

    if (!link) {
      return res.status(404).json({ success: false, message: 'Link not found' });
    }

    // Ensure user owns this link
    if (link.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this link' });
    }

    // Calculate health score
    const healthScore = Link.calculateHealthScore(link);

    res.status(200).json({
      success: true,
      data: {
        ...link.toObject(),
        healthScore,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a link
 * @route   DELETE /api/links/:id
 * @access  Private
 */
export const deleteLink = async (req, res, next) => {
  try {
    const link = await Link.findById(req.params.id);

    if (!link) {
      return res.status(404).json({ success: false, message: 'Link not found' });
    }

    // Ensure user owns this link
    if (link.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this link' });
    }

    // Delete associated clicks
    await Click.deleteMany({ link: link._id });

    // Delete link
    await Link.deleteOne({ _id: link._id });

    res.status(200).json({
      success: true,
      message: 'Link deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Redirect short URL to original URL
 * @route   GET /:shortCode
 * @access  Public
 */
export const redirectLink = async (req, res, next) => {
  try {
    const { shortCode } = req.params;

    // Find link by shortCode or customAlias
    const link = await Link.findOne({
      $or: [{ shortCode }, { customAlias: shortCode.toLowerCase() }],
    });

    if (!link) {
      return res.status(404).json({ success: false, message: 'Link not found' });
    }

    // Check if link is disabled
    if (!link.isEnabled) {
      return res.status(410).json({ success: false, message: 'This link has been disabled' });
    }

    // Check if link is expired
    if (link.isExpired()) {
      // Update status to Expired if not already
      if (link.status !== 'Expired') {
        link.status = 'Expired';
        await link.save();
      }
      return res.status(410).json({ success: false, message: 'This link has expired' });
    }

    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    const referrer = req.get('Referrer') || req.get('Referer') || 'Direct';

    // Perform geolocation and Click creation asynchronously to not block redirection
    getGeoLocation(ip).then((geo) => {
      const clickData = {
        link: link._id,
        user: link.user,
        ipAddress: ip,
        userAgent,
        referrer,
        browser: parseBrowser(userAgent),
        os: parseOS(userAgent),
        device: parseDevice(userAgent),
        ...geo,
      };
      return Click.create(clickData);
    }).catch(console.error);

    // Update link stats
    link.clickCount += 1;
    link.lastVisited = new Date();
    await link.save();

    // Redirect to original URL
    res.redirect(302, link.originalUrl);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing link (original URL, alias, expiry date, isEnabled, isPublicStats)
 * @route   PUT /api/links/:id
 * @access  Private
 */
export const updateLink = async (req, res, next) => {
  try {
    const { originalUrl, customAlias, expiryDate, isEnabled, isPublicStats } = req.body;
    const link = await Link.findById(req.params.id);

    if (!link) {
      return res.status(404).json({ success: false, message: 'Link not found' });
    }

    if (link.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this link' });
    }

    if (originalUrl) {
      if (!validator.isURL(originalUrl, { require_protocol: true })) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid URL (must start with http:// or https://)',
        });
      }
      link.originalUrl = originalUrl;
    }

    if (customAlias !== undefined) {
      if (customAlias) {
        const aliasLower = customAlias.trim().toLowerCase();
        // Check if taken by another link
        const existingAlias = await Link.findOne({
          customAlias: aliasLower,
          _id: { $ne: link._id }
        });
        if (existingAlias) {
          return res.status(400).json({
            success: false,
            message: 'This custom alias is already taken. Please choose another one.',
          });
        }
        link.customAlias = aliasLower;
        link.shortCode = aliasLower;
      } else {
        link.customAlias = null;
        // regenerate shortCode if customAlias was removed
        link.shortCode = generateShortCode();
      }
    }

    if (expiryDate !== undefined) {
      link.expiryDate = expiryDate ? new Date(expiryDate) : null;
    }

    if (isEnabled !== undefined) {
      link.isEnabled = isEnabled;
      if (isEnabled) {
        link.status = link.isExpired() ? 'Expired' : 'Active';
      } else {
        link.status = 'Disabled';
      }
    }

    if (isPublicStats !== undefined) {
      link.isPublicStats = isPublicStats;
    }

    await link.save();

    res.status(200).json({
      success: true,
      data: link,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk create short links from CSV-parsed JSON
 * @route   POST /api/links/bulk
 * @access  Private
 */
export const bulkCreateLinks = async (req, res, next) => {
  try {
    const { links } = req.body;

    if (!links || !Array.isArray(links)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of links in the request body.',
      });
    }

    const createdLinks = [];
    const errors = [];

    for (let i = 0; i < links.length; i++) {
      const item = links[i];
      const { originalUrl, customAlias, expiryDate } = item;

      // URL validation
      if (!originalUrl || !validator.isURL(originalUrl, { require_protocol: true })) {
        errors.push({ index: i, originalUrl, error: 'Invalid URL. Must start with http:// or https://' });
        continue;
      }

      let shortCode;
      if (customAlias) {
        const aliasLower = customAlias.trim().toLowerCase();
        // Check alias availability
        const aliasTaken = await Link.findOne({
          $or: [{ shortCode: aliasLower }, { customAlias: aliasLower }]
        });
        if (aliasTaken) {
          errors.push({ index: i, originalUrl, error: `Alias '${customAlias}' is already taken.` });
          continue;
        }
        shortCode = aliasLower;
      } else {
        shortCode = generateShortCode();
        let codeTaken = await Link.findOne({ shortCode });
        while (codeTaken) {
          shortCode = generateShortCode();
          codeTaken = await Link.findOne({ shortCode });
        }
      }

      try {
        const newLink = await Link.create({
          user: req.user._id,
          originalUrl,
          shortCode,
          customAlias: customAlias ? customAlias.trim().toLowerCase() : null,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
        });
        createdLinks.push(newLink);
      } catch (err) {
        errors.push({ index: i, originalUrl, error: err.message });
      }
    }

    res.status(201).json({
      success: true,
      data: createdLinks,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    next(error);
  }
};

// Geolocation parser using public API with fallback for local IP addresses
const getGeoLocation = async (ip) => {
  const localIps = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
  if (!ip || localIps.includes(ip) || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.16.')) {
    const mockLocations = [
      { country: 'United States', city: 'New York', region: 'NY' },
      { country: 'India', city: 'Mumbai', region: 'MH' },
      { country: 'United Kingdom', city: 'London', region: 'ENG' },
      { country: 'Germany', city: 'Berlin', region: 'BE' },
      { country: 'Canada', city: 'Toronto', region: 'ON' },
      { country: 'Japan', city: 'Tokyo', region: 'TKY' }
    ];
    return mockLocations[Math.floor(Math.random() * mockLocations.length)];
  }

  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city`);
    if (!response.ok) throw new Error('Failed to fetch geo data');
    const data = await response.json();
    if (data.status === 'success') {
      return {
        country: data.country || 'Unknown',
        region: data.regionName || 'Unknown',
        city: data.city || 'Unknown'
      };
    }
  } catch (error) {
    console.error('Geo lookup error:', error.message);
  }
  return { country: 'Unknown', city: 'Unknown', region: 'Unknown' };
};

// Helper functions to parse user agent
const parseBrowser = (userAgent) => {
  if (!userAgent) return 'Unknown';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Other';
};

const parseOS = (userAgent) => {
  if (!userAgent) return 'Unknown';
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  return 'Other';
};

const parseDevice = (userAgent) => {
  if (!userAgent) return 'unknown';
  if (userAgent.includes('Mobile')) return 'mobile';
  if (userAgent.includes('Tablet')) return 'tablet';
  return 'desktop';
};