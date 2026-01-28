import Event from '../models/Event.js';
import { mockEvents, mockDailyDemand } from '../data/mockData.js';

// Check if we should use mock data
const useMockData = process.env.USE_MOCK_DATA === 'true' || true; // Default to mock for now

export async function getEvents(req, res) {
  try {
    const {
      startDate,
      endDate,
      eventType,
      venueId,
      limit = 100,
      offset = 0
    } = req.query;

    let events;
    
    try {
      events = await Event.findAll({
        startDate,
        endDate,
        eventType,
        venueId,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10)
      });
    } catch (dbError) {
      console.log('Database unavailable, using mock data');
      // Filter mock events
      events = mockEvents.filter(e => {
        if (startDate && e.start_date < startDate) return false;
        if (endDate && e.start_date > endDate) return false;
        if (eventType && e.event_type !== eventType) return false;
        return true;
      }).slice(parseInt(offset, 10), parseInt(offset, 10) + parseInt(limit, 10));
    }

    res.json({
      success: true,
      data: events,
      pagination: {
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        count: events.length
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events'
    });
  }
}

export async function getEventById(req, res) {
  try {
    const { id } = req.params;
    let event;
    
    try {
      event = await Event.findById(id);
    } catch (dbError) {
      console.log('Database unavailable, using mock data');
      event = mockEvents.find(e => e.id === id);
    }

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch event'
    });
  }
}

export async function getCalendarEvents(req, res) {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        error: 'Month and year are required'
      });
    }

    let events;
    
    try {
      events = await Event.findForCalendar(
        parseInt(year, 10),
        parseInt(month, 10)
      );
    } catch (dbError) {
      console.log('Database unavailable, using mock data');
      // Filter mock events for the requested month/year
      const targetMonth = parseInt(month, 10);
      const targetYear = parseInt(year, 10);
      
      events = mockEvents.filter(e => {
        const eventDate = new Date(e.start_date);
        return eventDate.getMonth() + 1 === targetMonth && 
               eventDate.getFullYear() === targetYear;
      }).map(e => ({
        ...e,
        venue_name: e.venue?.name
      }));
    }

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch calendar events'
    });
  }
}

export default {
  getEvents,
  getEventById,
  getCalendarEvents
};
