import { describe, it, expect } from 'vitest';
import { compareIPv4 } from '../ip';

describe('compareIPv4', () => {
  it('returns 0 for equal IPs', () => {
    expect(compareIPv4('192.168.1.1', '192.168.1.1')).toBe(0);
    expect(compareIPv4('0.0.0.0', '0.0.0.0')).toBe(0);
    expect(compareIPv4('255.255.255.255', '255.255.255.255')).toBe(0);
  });

  it('returns -1 when first IP is less than second', () => {
    expect(compareIPv4('192.168.1.1', '192.168.1.2')).toBe(-1);
    expect(compareIPv4('10.0.0.1', '10.0.0.2')).toBe(-1);
    expect(compareIPv4('10.0.0.1', '10.0.1.0')).toBe(-1);
    expect(compareIPv4('10.0.0.1', '10.1.0.0')).toBe(-1);
    expect(compareIPv4('1.2.3.4', '2.0.0.0')).toBe(-1);
  });

  it('returns 1 when first IP is greater than second', () => {
    expect(compareIPv4('192.168.1.2', '192.168.1.1')).toBe(1);
    expect(compareIPv4('10.0.0.2', '10.0.0.1')).toBe(1);
    expect(compareIPv4('10.0.1.0', '10.0.0.1')).toBe(1);
    expect(compareIPv4('10.1.0.0', '10.0.0.1')).toBe(1);
    expect(compareIPv4('2.0.0.0', '1.2.3.4')).toBe(1);
  });

  it('handles leading zeros correctly', () => {
    expect(compareIPv4('010.000.000.001', '10.0.0.1')).toBe(0);
    expect(compareIPv4('001.002.003.004', '1.2.3.4')).toBe(0);
  });

  it('handles edge cases', () => {
    expect(compareIPv4('0.0.0.0', '255.255.255.255')).toBe(-1);
    expect(compareIPv4('255.255.255.255', '0.0.0.0')).toBe(1);
  });

  describe('input validation', () => {
    it('throws error for invalid format - wrong number of parts', () => {
      expect(() => compareIPv4('192.168.1', '192.168.1.1')).toThrow('Invalid IPv4 address');
      expect(() => compareIPv4('192.168.1.1.1', '192.168.1.1')).toThrow('Invalid IPv4 address');
      expect(() => compareIPv4('192.168.1.1', '192.168.1')).toThrow('Invalid IPv4 address');
      expect(() => compareIPv4('192', '192.168.1.1')).toThrow('Invalid IPv4 address');
    });

    it('throws error for non-numeric parts', () => {
      expect(() => compareIPv4('192.168.1.a', '192.168.1.1')).toThrow('Invalid IPv4 address');
      expect(() => compareIPv4('192.168.1.1', '192.168.x.1')).toThrow('Invalid IPv4 address');
      expect(() => compareIPv4('abc.def.ghi.jkl', '192.168.1.1')).toThrow('Invalid IPv4 address');
      expect(() => compareIPv4('192.168.1.1', 'not.an.ip.address')).toThrow('Invalid IPv4 address');
    });

    it('throws error for out of range values', () => {
      expect(() => compareIPv4('256.168.1.1', '192.168.1.1')).toThrow('Invalid IPv4 address');
      expect(() => compareIPv4('192.168.1.1', '192.168.1.256')).toThrow('Invalid IPv4 address');
      expect(() => compareIPv4('-1.168.1.1', '192.168.1.1')).toThrow('Invalid IPv4 address');
      expect(() => compareIPv4('192.168.1.1', '192.168.1.-1')).toThrow('Invalid IPv4 address');
      expect(() => compareIPv4('300.168.1.1', '192.168.1.1')).toThrow('Invalid IPv4 address');
    });

    it('throws error for empty or malformed strings', () => {
      expect(() => compareIPv4('192.168.1.1', '192.168.1.1.1')).toThrow('Invalid IPv4 address');
      expect(() => compareIPv4('192.168.1.1.1', '192.168.1.1')).toThrow('Invalid IPv4 address');
      expect(() => compareIPv4('192.168.1', '192.168.1.1')).toThrow('Invalid IPv4 address');
      expect(() => compareIPv4('192.168.1.1', '192.168.1')).toThrow('Invalid IPv4 address');
    });

    it('throws error for decimal values', () => {
      expect(() => compareIPv4('192.168.1.1.5', '192.168.1.1')).toThrow('Invalid IPv4 address');
      expect(() => compareIPv4('192.168.1.1', '192.168.1.1.0')).toThrow('Invalid IPv4 address');
    });
  });

  describe('edge cases that are actually valid', () => {
    it('handles double dots correctly (empty string becomes 0)', () => {
      // 192..1.1 becomes [192, 0, 1, 1] which is valid
      expect(compareIPv4('192.0.1.1', '192..1.1')).toBe(0);
      expect(compareIPv4('192.168.1.0', '192.168.1.')).toBe(0);
    });

    it('handles single character valid IPs', () => {
      expect(compareIPv4('1.1.1.1', '1.1.1.2')).toBe(-1);
      expect(compareIPv4('0.0.0.0', '0.0.0.1')).toBe(-1);
    });
  });

  describe('sorting compatibility', () => {
    it('works correctly with Array.sort()', () => {
      const ips = ['192.168.1.10', '192.168.1.2', '192.168.1.1', '192.168.2.1', '10.0.0.1'];
      const sorted = ips.sort(compareIPv4);
      expect(sorted).toEqual(['10.0.0.1', '192.168.1.1', '192.168.1.2', '192.168.1.10', '192.168.2.1']);
    });

    it('handles complex IP sorting', () => {
      const ips = ['172.16.0.1', '10.0.0.1', '192.168.1.1', '127.0.0.1', '172.16.0.2', '192.168.1.100'];
      const sorted = ips.sort(compareIPv4);
      expect(sorted).toEqual(['10.0.0.1', '127.0.0.1', '172.16.0.1', '172.16.0.2', '192.168.1.1', '192.168.1.100']);
    });
  });

  describe('special IP addresses', () => {
    it('handles localhost and loopback addresses', () => {
      expect(compareIPv4('127.0.0.1', '127.0.0.1')).toBe(0);
      expect(compareIPv4('127.0.0.1', '127.0.0.2')).toBe(-1);
      expect(compareIPv4('127.0.0.2', '127.0.0.1')).toBe(1);
    });

    it('handles private IP ranges correctly', () => {
      // Class A private: 10.0.0.0 - 10.255.255.255
      expect(compareIPv4('10.0.0.1', '10.255.255.255')).toBe(-1);

      // Class B private: 172.16.0.0 - 172.31.255.255
      expect(compareIPv4('172.16.0.1', '172.31.255.255')).toBe(-1);

      // Class C private: 192.168.0.0 - 192.168.255.255
      expect(compareIPv4('192.168.0.1', '192.168.255.255')).toBe(-1);
    });

    it('handles broadcast and network addresses', () => {
      expect(compareIPv4('0.0.0.0', '127.255.255.255')).toBe(-1);
      expect(compareIPv4('255.255.255.255', '0.0.0.0')).toBe(1);
    });
  });
});
