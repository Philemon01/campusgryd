import { FeatureCollection, LineString } from 'geojson';

interface Node {
  id: string;
  lat: number;
  lng: number;
}

interface Edge {
  from: string;
  to: string;
  distance: number;
  type: 'road' | 'path' | 'link';
}

export type RoutingMode = 'shortest' | 'accessible' | 'main_roads';

export class CustomCampusRouter {
  private nodes: Map<string, Node> = new Map();
  private edges: Edge[] = [];

  constructor(features: FeatureCollection) {
    this.buildGraph(features);
  }

  private getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private buildGraph(features: FeatureCollection) {
    features.features.forEach((feature) => {
      if (feature.geometry.type === 'LineString') {
        const coords = (feature.geometry as LineString).coordinates;
        const featureId = (feature.id as string || '').toLowerCase();
        
        let type: Edge['type'] = 'path';
        if (featureId.includes('road')) type = 'road';
        if (featureId.includes('link') || featureId.includes('intersection')) type = 'link';

        for (let i = 0; i < coords.length - 1; i++) {
          const p1 = coords[i];
          const p2 = coords[i+1];
          
          const id1 = `${p1[1].toFixed(6)},${p1[0].toFixed(6)}`;
          const id2 = `${p2[1].toFixed(6)},${p2[0].toFixed(6)}`;

          if (!this.nodes.has(id1)) this.nodes.set(id1, { id: id1, lat: p1[1], lng: p1[0] });
          if (!this.nodes.has(id2)) this.nodes.set(id2, { id: id2, lat: p2[1], lng: p2[0] });

          const dist = this.getDistance(p1[1], p1[0], p2[1], p2[0]);
          this.edges.push({ from: id1, to: id2, distance: dist, type });
          this.edges.push({ from: id2, to: id1, distance: dist, type });
        }
      }
    });
  }

  private getWeight(edge: Edge, mode: RoutingMode): number {
    if (mode === 'shortest') return edge.distance;
    
    if (mode === 'accessible' || mode === 'main_roads') {
      // Prioritize roads significantly
      if (edge.type === 'road') return edge.distance * 1.0;
      if (edge.type === 'link') return edge.distance * 1.2;
      return edge.distance * 5.0; // Heavily penalize footpaths for "accessible"
    }
    
    return edge.distance;
  }

  private findNearestNode(lat: number, lng: number): string {
    let nearestId = '';
    let minDist = Infinity;

    this.nodes.forEach((node) => {
      const dist = this.getDistance(lat, lng, node.lat, node.lng);
      if (dist < minDist) {
        minDist = dist;
        nearestId = node.id;
      }
    });

    return nearestId;
  }

  public findRoute(
    start: [number, number], 
    end: [number, number], 
    mode: RoutingMode = 'shortest'
  ): [number, number][] | null {
    const startNode = this.findNearestNode(start[0], start[1]);
    const endNode = this.findNearestNode(end[0], end[1]);

    if (!startNode || !endNode) return null;

    const distances: Map<string, number> = new Map();
    const previous: Map<string, string | null> = new Map();
    const unvisited = new Set<string>();

    this.nodes.forEach((_, id) => {
      distances.set(id, Infinity);
      previous.set(id, null);
      unvisited.add(id);
    });

    distances.set(startNode, 0);

    while (unvisited.size > 0) {
      let current: string | null = null;
      let minD = Infinity;
      
      // Simple pick min (could be optimized with Priority Queue if graph was huge)
      unvisited.forEach(id => {
        const d = distances.get(id)!;
        if (d < minD) {
          minD = d;
          current = id;
        }
      });

      if (!current || current === endNode) break;
      if (distances.get(current) === Infinity) break;

      unvisited.delete(current);

      const neighbors = this.edges.filter(e => e.from === current);
      for (const edge of neighbors) {
        if (!unvisited.has(edge.to)) continue;
        
        const weight = this.getWeight(edge, mode);
        const alt = distances.get(current)! + weight;
        
        if (alt < distances.get(edge.to)!) {
          distances.set(edge.to, alt);
          previous.set(edge.to, current);
        }
      }
    }

    const path: [number, number][] = [];
    let curr: string | null = endNode;
    
    if (previous.get(curr) === null && curr !== startNode) return null;

    while (curr) {
      const node = this.nodes.get(curr)!;
      path.unshift([node.lat, node.lng]);
      curr = previous.get(curr) || null;
    }

    if (path.length > 0) {
      // Only add start/end if they aren't already represented by the nearest node
      const firstNodeDist = this.getDistance(start[0], start[1], path[0][0], path[0][1]);
      if (firstNodeDist > 1) path.unshift(start);

      const lastNodeDist = this.getDistance(end[0], end[1], path[path.length-1][0], path[path.length-1][1]);
      if (lastNodeDist > 1) path.push(end);
    }

    return path.length >= 2 ? path : null;
  }
}
